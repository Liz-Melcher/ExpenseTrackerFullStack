import pool from '../Library/database.js';


/**
 * GET /api/accounts
 * 🔐 Requires Bearer Token
 * 📦 No JSON body required
 * 📌 Example Thunder Client Test:
 *   - Method: GET
 *   - URL: http://localhost:3000/api/accounts
 *   - Auth: Bearer Token (from login)
 */
//getAccounts
export const getAccounts = async (req, res) => {
  try {
    const { userId } = req.user;
    console.log("🔍 Fetching accounts for user:", userId);

    const accounts = await pool.query(
      "SELECT * FROM tblaccount WHERE userId = $1",
      [userId]
    );

    if (!accounts.rows.length) {
      console.log("⚠️ No accounts found for user:", userId);
      return res.status(404).json({ message: "No accounts found" });
    }

    console.log("✅ Accounts found for user:", userId);
    res.status(200).json({ accounts: accounts.rows });
  } catch (error) {
    console.error("❌ Error fetching accounts:", error);
    res.status(500).json({ message: "Error fetching accounts" });
  }
};

/**
 * POST /api/accounts/create
 * 🔐 Requires Bearer Token
 * 📦 JSON Body Required:
 * {
 *   "accountName": "Bank1",
 *   "accountNumber": "NotaRealNumber",
 *   "initialBalance": 100
 * }
 * 📌 Example Thunder Client Test:
 *   - Method: POST
 *   - URL: http://localhost:3000/api/accounts/create
 *   - Body: JSON (see above)
 *   - Auth: Bearer Token
 */
//createAccounts
// createAccounts
export const createAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { accountName, accountNumber, initialBalance } = req.body;
    console.log("🆕 Creating account for user:", userId);

    if (!accountName || initialBalance === undefined) {
      console.log("⚠️ Missing account details");
      return res.status(400).json({ message: "Account name and balance are required" });
    }

    // Check if account with same name or number exists for this user
    const duplicateCheck = await pool.query(
      `SELECT * FROM tblaccount 
       WHERE userId = $1 AND (account_name = $2 OR account_number = $3)`,
      [userId, accountName, accountNumber]
    );

    if (duplicateCheck.rows.length > 0) {
      console.log("⚠️ Duplicate account detected");
      return res.status(400).json({ message: "Account with this name or number already exists" });
    }

    // Create new account
    const newAccount = await pool.query(
      "INSERT INTO tblaccount (userId, account_name, account_number, account_balance) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, accountName, accountNumber, initialBalance]
    );

    const account = newAccount.rows[0];

    // Update user's accounts array (optional, if tbluser.accounts is an integer[] column)
    const updateUserAccountQuery = {
      text: "UPDATE tbluser SET accounts = array_cat(accounts, $1), updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      values: [[account.id], userId]
    };
    await pool.query(updateUserAccountQuery);

    // Add initial deposit transaction
    const description = `${accountName} - Initial Deposit`;

    await pool.query(
      "INSERT INTO tbltransaction (userId, description, status, source, amount, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, description, "completed", accountName, initialBalance, "deposit"]
    );

    console.log("✅ Account created:", account);
    res.status(201).json({ account });
  } catch (error) {
    console.error("❌ Error creating account:", error);
    res.status(500).json({ message: "Error creating account" });
  }
};

/**
 * PUT /api/accounts/:id/add-money
 * 🔐 Requires Bearer Token
 * 📦 JSON Body Required:
 * {
 *   "amount": 100
 * }
 * 📌 Example Thunder Client Test:
 *   - Method: PUT
 *   - URL: http://localhost:3000/api/accounts/1/add-money
 *   - Body: JSON (see above)
 *   - Auth: Bearer Token
 */
//addMoneyToAccount
export const addMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { amount } = req.body;
    console.log("💰 Adding money to account for user:", userId);

    if (!amount || amount <= 0) {
      console.log("⚠️ Invalid amount");
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const account = await pool.query(
      "SELECT * FROM tblaccount WHERE id = $1 AND userId = $2",
      [id, userId]
    );

    if (!account.rows.length) {
      console.log("⚠️ Account not found or access denied");
      return res.status(404).json({ message: "Account not found" });
    }
    const description = `Added ${amount} to account ${account.rows[0].account_name}`;

    const updatedAccount = await pool.query(
      "UPDATE tblaccount SET account_balance = account_balance + $1 WHERE id = $2 RETURNING *",
      [amount, id]
    );

    console.log("✅ Money added to account:", description, updatedAccount.rows[0]);
    res.status(200).json({ account: updatedAccount.rows[0] });
  } catch (error) {
    console.error("❌ Error adding money to account:", error);
    res.status(500).json({ message: "Error adding money to account" });
  }
};