import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getBooks(req: Request, res: Response) {
  try {
    const books = await prisma.book.findMany({
      orderBy: { id: "desc" },
    });

    return res.json(books);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function getBookById(req: Request, res: Response) {
  try {
    const book = await prisma.book.findUnique({ where: { id: Number(req.params.id) } });
    if (!book) return res.status(404).json({ message: "Libro non trovato" });
    return res.json(book);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function createBook(req: Request, res: Response) {
  try {
    const { title, author, totalCopies } = req.body;

    const safeTitle = typeof title === "string" ? title.trim() : "";
    const safeAuthor = typeof author === "string" ? author.trim() : "";
    const totalCopiesNumber = Number(totalCopies);

    if (!safeTitle || !safeAuthor) {
      return res.status(400).json({ message: "Titolo e autore sono obbligatori" });
    }

    if (!Number.isFinite(totalCopiesNumber) || totalCopiesNumber <= 0) {
      return res.status(400).json({ message: "totalCopies deve essere maggiore di 0" });
    }
    const bookData = {
      title: safeTitle,
      author: safeAuthor,
      totalCopies: totalCopiesNumber,
      available: totalCopiesNumber,
    } as any;

    const book = await prisma.book.create({ data: bookData });

    return res.status(201).json({
      message: "Libro aggiunto con successo",
      book,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function updateBook(req: Request, res: Response) {
  try {
    const { title, author, totalCopies } = req.body;
    const book = await prisma.book.findUnique({ where: { id: Number(req.params.id) } });
    if (!book) return res.status(404).json({ message: "Libro non trovato" });

    if (title !== undefined && (!String(title).trim())) {
      return res.status(400).json({ message: "Titolo non valido" });
    }

    if (author !== undefined && (!String(author).trim())) {
      return res.status(400).json({ message: "Autore non valido" });
    }

    if (totalCopies !== undefined) {
      const copies = Number(totalCopies);
      if (!Number.isFinite(copies) || copies <= 0) {
        return res.status(400).json({ message: "totalCopies deve essere maggiore di 0" });
      }
    }

    const updated = await prisma.book.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(title && { title: String(title).trim() }),
        ...(author && { author: String(author).trim() }),
        ...(totalCopies !== undefined && {
          totalCopies: Number(totalCopies),
          available: book.available + (Number(totalCopies) - book.totalCopies),
        }),
      },
    });

    return res.json({ message: "Libro aggiornato", book: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function deleteBook(req: Request, res: Response) {
  try {
    const book = await prisma.book.findUnique({ where: { id: Number(req.params.id) } });
    if (!book) return res.status(404).json({ message: "Libro non trovato" });

    await prisma.book.delete({ where: { id: Number(req.params.id) } });
    return res.json({ message: "Libro eliminato" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}
