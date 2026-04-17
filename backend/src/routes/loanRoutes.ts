import { Router } from "express";
import { createLoan, getLoanById, returnLoan } from "../controllers/loanController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/loans", authMiddleware, createLoan);
router.get("/loans/:id", getLoanById);
router.put("/loans/:id/return", authMiddleware, returnLoan);

export default router;
