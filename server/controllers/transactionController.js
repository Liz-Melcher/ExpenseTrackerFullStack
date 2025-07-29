import pool from "../Library/database.js";

export const getTransactions = async (req, res) => {
  try {
    const today = new Date();
    const _sevenDaysAgo = new Date(today);
    _sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgo = _sevenDaysAgo.toISOString().split('T')[0];

    const { dayFrom, dayTo, search } = req.query;
    const { userId } = req.user;
    const startDate = new Date(dayFrom || sevenDaysAgo);
    const endDate = dayTo ? new Date(dayTo) : today;
    console.log(`📅 Fetching transactions for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()} with search term "${search}"`);

    const transactions = await pool.query(
      "SELECT * FROM tbltransaction WHERE user_id = $1 AND createdAtDate >= $2 AND createdAtDate <= $3 AND (description ILIKE $4 OR source ILIKE $4 OR status ILIKE $4) ORDER BY id DESC",
      [userId, startDate, endDate, `%${search || ''}%`]
    );
    console.log("Fetched transactions for user:", userId, transactions)

    res.status(200).json({ transactions: transactions.rows });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const { userId } = req.user;
    const { accountId } = req.params;
    console.log(`🔍 Fetching account with ID ${accountId} for user ${userId}`);
    const { description, status, source, amount, type } = req.body;
    if (!description || !status || !source || !amount || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    const validTypes = ["income", "expense"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }
    const account = await pool.query(
      "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      [accountId, userId]
    );
    if (account.rows.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }
    console.log(`💰 Adding transaction for user ${userId}:`, { description, status, source, amount, type });

    await pool.query("BEGIN");

    await pool.query(
      "UPDATE tblaccount SET account_balance = account_balance - $1 WHERE id = $2",
      [amount, accountId]
    );

    const newTransaction = await pool.query(
      "INSERT INTO tbltransaction (user_id, description, status, source, amount, type, createdAtDate) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
      [userId, description, status, source, amount, type]
    );

    await pool.query("COMMIT");
    console.log("✅ Transaction committed:", newTransaction.rows[0]);

    res.status(201).json({ transaction: newTransaction.rows[0] });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Error adding transaction" });
  }
}

export const transferMoneytoAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { fromAccountId, toAccountId, amount } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const fromAccount = await pool.query(
      "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      [fromAccountId, userId]
    );
    const toAccount = await pool.query(
      "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      [toAccountId, userId]
    );

    if (fromAccount.rows.length === 0 || toAccount.rows.length === 0) {
      return res.status(404).json({ message: "One or both accounts not found" });
    }

    if (fromAccount.rows[0].account_balance < amount) {
      return res.status(400).json({ message: "Insufficient funds in the source account" });
    }

    console.log(`🔄 Transferring ${amount} from account ${fromAccountId} to account ${toAccountId} for user ${userId}`);

    await pool.query("BEGIN");

    await pool.query(
      "UPDATE tblaccount SET account_balance = account_balance - $1 WHERE id = $2",
      [amount, fromAccountId]
    );

    await pool.query(
      "UPDATE tblaccount SET account_balance = account_balance + $1 WHERE id = $2",
      [amount, toAccountId]
    );

    const newTransactionFrom = await pool.query(
      "INSERT INTO tbltransaction (user_id, account_id, description, status, source, amount, type, createdAtDate) VALUES ($1, $2, 'Transfer to Account', 'Completed', 'Transfer', $3, 'expense', NOW()) RETURNING *",
      [userId, fromAccountId, amount]
    );

    const newTransactionTo = await pool.query(
      "INSERT INTO tbltransaction (user_id, account_id, description, status, source, amount, type, createdAtDate) VALUES ($1, $2, 'Transfer from Account', 'Completed', 'Transfer', $3, 'income', NOW()) RETURNING *",
      [userId, toAccountId, amount]
    );

    await pool.query("COMMIT");
    console.log("✅ Transfer committed:", {
      from: newTransactionFrom.rows[0],
      to: newTransactionTo.rows[0]
    });

    res.status(201).json({ transactionFrom: newTransactionFrom.rows[0], transactionTo: newTransactionTo.rows[0] });
  } catch (error) {
    console.error("Error transferring money:", error);
    res.status(500).json({ message: "Error transferring money" });
  }
};