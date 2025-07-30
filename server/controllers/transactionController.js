import pool from "../Library/database.js";
import express from 'express';
import { getMonthName } from "../Library/index.js";

/**
 * GET /api/transactions
 * 🔐 Requires Bearer Token
 * 📦 Optional Query Parameters:
 *   - dayFrom: ISO date string (e.g., 2025-07-01)
 *   - dayTo: ISO date string (e.g., 2025-07-29)
 *   - search: keyword to filter by description/source/status
 * 📌 Example Thunder Client Test:
 *   - Method: GET
 *   - URL: http://localhost:3000/api/transactions?dayFrom=2025-07-01&dayTo=2025-07-29&search=coffee
 *   - Auth: Bearer Token
 */
export const getTransactions = async (req, res) => {
  try {
    const today = new Date();
    const _sevenDaysAgo = new Date(today);
    _sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgo = _sevenDaysAgo.toISOString().split('T')[0];

    const { dayFrom, dayTo, search } = req.query;
    const searchTerm = typeof search === 'string' ? search.trim() : '';
    const { userId } = req.user;
    const startDate = new Date(dayFrom || sevenDaysAgo);
    const endDate = new Date(dayTo || today);
    endDate.setUTCHours(23, 59, 59, 999);
    console.log(`📅 Fetching transactions for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()} with search term "${searchTerm}"`);

    const transactions = await pool.query(
      `SELECT * FROM tbltransaction
       WHERE userid = $1
         AND createdAt >= $2
         AND createdAt <= $3
         AND (
           $4 = '' OR
           description ILIKE '%' || $4 || '%' OR
           source ILIKE '%' || $4 || '%' OR
           status ILIKE '%' || $4 || '%'
         )
       ORDER BY id DESC`,
      [userId, startDate, endDate, searchTerm]
    );
    console.log(`✅ Found ${transactions.rowCount} transactions for user ${userId}`);

    res.status(200).json({ transactions: transactions.rows });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

/**
 * POST /api/transactions/add-transaction/:accountId
 * 🔐 Requires Bearer Token
 * 📦 JSON Body Required:
 * {
 *   "description": "Coffee shop",
 *   "status": "Completed",
 *   "source": "Bank",
 *   "amount": 6.75,
 *   "type": "expense"
 * }
 * 📌 Example Thunder Client Test:
 *   - Method: POST
 *   - URL: http://localhost:3000/api/transactions/add-transaction/3
 *   - Body: JSON (see above)
 *   - Auth: Bearer Token
 */
export const addTransaction = async (req, res) => {
  try {
    console.log("🚨 addTransaction triggered");
    const { userId } = req.user;
    console.log("👤 req.user:", req.user);
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
      "SELECT * FROM tblaccount WHERE id = $1 AND userid = $2",
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
      "INSERT INTO tbltransaction (userid, description, status, source, amount, type, createdAt) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
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

/**
 * PUT /transactions/transfer-money
 * 🔐 Requires Bearer Token
 * 📦 JSON Body Required:
 * {
 *   "fromAccountId": 1,
 *   "toAccountId": 2,
 *   "amount": 50
 * }
 * 📌 Example Thunder Client Test:
 *   - Method: PUT
 *   - URL: http://localhost:3000/api/transactions/transfer-money
 *   - Body: JSON (see above)
 *   - Auth: Bearer Token
 */
export const transferMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { fromAccountId, toAccountId, amount } = req.body;

    // Log when route is triggered
    console.log("♻️ transferMoneytoAccount route hit with:", { fromAccountId, toAccountId, amount });

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const fromAccount = await pool.query(
      "SELECT * FROM tblaccount WHERE id = $1 AND userid = $2",
      [fromAccountId, userId]
    );
    const toAccount = await pool.query(
      "SELECT * FROM tblaccount WHERE id = $1 AND userid = $2",
      [toAccountId, userId]
    );

    if (fromAccount.rows.length === 0 || toAccount.rows.length === 0) {
      console.log("❌ One or both accounts not found", {
        fromAccount: fromAccount.rows,
        toAccount: toAccount.rows
      });
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
      "INSERT INTO tbltransaction (userid, description, status, source, amount, type, createdAt) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
      [userId, 'Transfer to Account', 'Completed', 'Transfer', amount, 'expense']
    );

    const newTransactionTo = await pool.query(
      "INSERT INTO tbltransaction (userid, description, status, source, amount, type, createdAt) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
      [userId, 'Transfer from Account', 'Completed', 'Transfer', amount, 'income']
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

/**
 * DELETE /api/transactions/:id
 * 🔐 Requires Bearer Token
 * 📦 No JSON Body Required
 * 📌 Example Thunder Client Test:
 *   - Method: DELETE
 *   - URL: http://localhost:3000/api/transactions/5
 *   - Auth: Bearer Token
 */
export const deleteTransaction = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const transaction = await pool.query(
      "SELECT * FROM tbltransaction WHERE id = $1 AND userid = $2",
      [id, userId]
    );

    if (transaction.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    console.log(`🗑️ Deleting transaction ${id} for user ${userId}`);

    await pool.query("BEGIN");

    await pool.query(
      "DELETE FROM tbltransaction WHERE id = $1",
      [id]
    );

    await pool.query("COMMIT");
    console.log("✅ Transaction deleted:", transaction.rows[0]);

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Error deleting transaction" });
  }
};

/**
 * GET /api/transactions/dashboard
 * 🔐 Requires Bearer Token
 * 📦 No JSON Body Required
 * 📌 Example Thunder Client Test:
 *   - Method: GET
 *   - URL: http://localhost:3000/api/transactions/dashboard
 *   - Auth: Bearer Token
 */
export const getDashboardInformation = async (req, res) => {
  try {
    const { userId } = req.user;
    console.log(`📊 Fetching dashboard information for user ${userId}`);

    let totalIncome = 0;
    let totalExpense = 0;

    const transactionResults = await pool.query(
      "SELECT type, SUM(amount) as totalAmount FROM tbltransaction WHERE userid = $1 GROUP BY type",
      [userId]
    );

    const transactions = transactionResults.rows;

    transactions.forEach((transaction) => {
      if (transaction.type === 'income') {
        totalIncome += parseFloat(transaction.totalAmount);
      } else if (transaction.type === 'expense') {
        totalExpense += parseFloat(transaction.totalAmount);
      }
    });

    const availableBalance = totalIncome - totalExpense;
    console.log(`Available balance for user ${userId}: ${availableBalance}`);

    //aggregate transactions to sum by type, group, month. 
    const year = new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const result = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM createdAt) AS month,
        type,
        SUM(amount) AS totalAmount
      FROM tbltransaction
      WHERE userid = $1 AND createdAt BETWEEN $2 AND $3
      GROUP BY EXTRACT(MONTH FROM createdAt), type
    `, [userId, startDate, endDate]);

    // organize data

    const data = new Array(12).fill().map((_, index) => {
        const monthData = result.rows.filter((item) => parseInt(item.month) === index + 1);
        const income = monthData.find((item) => item.type === 'income');
        const expense = monthData.find((item) => item.type === 'expense');
        return {
          month: getMonthName(index + 1),
          income: income ? parseFloat(income.totalAmount) : 0,
          expense: expense ? parseFloat(expense.totalAmount) : 0,
        };
    });

    const lastTransactionResults = await pool.query(
      "SELECT * FROM tbltransaction WHERE userid = $1 ORDER BY createdAt DESC LIMIT 5",
      [userId]
    );

    const lastAccountsResults = await pool.query(
      "SELECT * FROM tblaccount WHERE userid = $1 ORDER BY createdAt DESC LIMIT 5",
      [userId]
    );

    res.status(200).json({
        status: "success",  
      availableBalance,
      totalExpense, 
        totalIncome,
      chartData: data,
      lastTransaction: lastTransactionResults.rows,
      lastAccounts: lastAccountsResults.rows
    });

  } catch (error) {
    console.error("Error fetching dashboard information:", error);
    res.status(500).json({ message: "Error fetching dashboard information" });
  }
}
