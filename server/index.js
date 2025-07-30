import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';

import routes from './routes/index.js'; // Assuming you have routes defined in this file

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

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

/**
 * DELETE /api/transactions/:id
 * 🔐 Requires Bearer Token
 * 📦 No JSON Body Required
 * 📌 Example Thunder Client Test:
 *   - Method: DELETE
 *   - URL: http://localhost:3000/api/transactions/5
 *   - Auth: Bearer Token
 */

/**
 * GET /api/transactions/dashboard
 * 🔐 Requires Bearer Token
 * 📦 No JSON Body Required
 * 📌 Example Thunder Client Test:
 *   - Method: GET
 *   - URL: http://localhost:3000/api/transactions/dashboard
 *   - Auth: Bearer Token
 */

// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Not Found" });
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});