import express from 'express';

import {
    addTransaction,
    getTransactions,
    getDashboardInformation,
    transferMoneyToAccount,
    deleteTransaction,
} from '../controllers/transactionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

console.log("✅ Transaction routes loaded");

const router = express.Router();

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
 *   - URL: http://localhost:3000/api/transactions/add-transaction/1
 *   - Body: JSON (see above)
 *   - Auth: Bearer Token
 */
router.post('/add-transaction/:accountId', authMiddleware, addTransaction);

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
router.get('/', authMiddleware, getTransactions);

/**
 * GET /api/transactions/dashboard
 * 🔐 Requires Bearer Token
 * 📦 No JSON Body Required
 * 📌 Example Thunder Client Test:
 *   - Method: GET
 *   - URL: http://localhost:3000/api/transactions/dashboard
 *   - Auth: Bearer Token
 */
router.get('/dashboard', authMiddleware, getDashboardInformation);

/**
 * PUT /api/transactions/transfer-money
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
router.put('/transfer-money', authMiddleware, transferMoneyToAccount);

/**
 * DELETE /api/transactions/:id
 * 🔐 Requires Bearer Token
 * 📦 No JSON Body Required
 * 📌 Example Thunder Client Test:
 *   - Method: DELETE
 *   - URL: http://localhost:3000/api/transactions/5
 *   - Auth: Bearer Token
 */
router.delete('/:id', authMiddleware, deleteTransaction);

export default router;