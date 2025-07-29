import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import accountRoutes from './accountRoutes.js';

// import accountRoutes from 'accountRoutes.js';
// import transactionRoutes from 'transactionRoutes.js';
// import userRouts from 'userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/user', userRoutes);

export default router;