import { Router } from "express";
import { createBook, deleteBook, getBookById, getBooks, updateBook } from "../controllers/bookController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/books", getBooks);
router.get("/books/:id", getBookById);
router.post("/books", authMiddleware, createBook);
router.put("/books/:id", authMiddleware, updateBook);
router.delete("/books/:id", authMiddleware, deleteBook);

export default router;
