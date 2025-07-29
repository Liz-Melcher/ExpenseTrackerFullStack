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
      [userId, startDate, endDate, search]
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
    console.log(`💰 Adding transaction for user ${userId}:`, { description, status, source, amount, type });

    const newTransaction = await pool.query(
      "INSERT INTO tbltransaction (user_id, description, status, source, amount, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, description, status, source, amount, type]
    );

    res.status(201).json({ transaction: newTransaction.rows[0] });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Error adding transaction" });
  }
}