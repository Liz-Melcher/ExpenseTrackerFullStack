import express from "express";
import {
    addMoneyToAccount,
    createAccount,
    getAccounts,
} from "../controllers/accountController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createAccount);
router.get("/", authMiddleware, getAccounts);
router.put("/:id/add-money", authMiddleware, addMoneyToAccount);

export default router;