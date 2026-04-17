import { Router } from "express";
import { getUserLoans, getUserOpenLoans, getUserPoints, getUsers } from "../controllers/userController";

const router = Router();

router.get("/users", getUsers);
router.get("/users/:id/loans", getUserLoans);
router.get("/users/:id/loans/open", getUserOpenLoans);
router.get("/users/:id/points", getUserPoints);

export default router;
