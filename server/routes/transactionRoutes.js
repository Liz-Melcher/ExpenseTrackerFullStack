import express from 'express';

import {
    addTransaction,
    getTransactions,
    getDashboardInformation,
    transferMoneytoAccount,
    deleteTransaction,
} from '../controllers/transactionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add-transaction/:accountId', authMiddleware, addTransaction);
router.get('/', authMiddleware, getTransactions);
router.get('/dashboard', authMiddleware, getDashboardInformation);
router.put('/transfer-money', authMiddleware, transferMoneytoAccount);
router.delete('/:id', authMiddleware, deleteTransaction);

export default router;