import express from 'express';
import { signupUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post("/sign-up", signupUser)
router.post("/login", loginUser);

export default router;