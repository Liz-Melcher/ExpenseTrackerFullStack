import express from 'express';
import { singupUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post("/sign-up", singupUser)
router.post("/login", loginUser);

export default router;