import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function createLoan(req: Request, res: Response) {
  try {
    const { userId, bookId } = req.body;
    const userIdHeader = Number(req.header("x-user-id"));

    if (!userId || !bookId) {
      return res.status(400).json({ message: "userId e bookId sono obbligatori" });
    }

    if (Number.isNaN(userIdHeader)) {
      return res.status(400).json({ message: "x-user-id non valido" });
    }

    if (Number(userId) !== userIdHeader) {
      return res.status(403).json({ message: "Puoi creare prestiti solo per il tuo utente" });
    }

    const book = await prisma.book.findUnique({ where: { id: Number(bookId) } });
    if (!book) return res.status(404).json({ message: "Libro non trovato" });
    if (book.available <= 0) return res.status(400).json({ message: "Nessuna copia disponibile" });

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    const POINTS_PER_BORROW = 2;

    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: {
          userId: userIdHeader,
          bookId: Number(bookId),
          endDate,
        },
      }),
      prisma.book.update({
        where: { id: Number(bookId) },
        data: { available: book.available - 1 },
      }),
      prisma.user.update({
        where: { id: userIdHeader },
        data: { points: { increment: POINTS_PER_BORROW } },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id: userIdHeader },
      select: { points: true },
    });

    return res.status(201).json({
      message: "Noleggio creato con successo",
      loan,
      scadenza: endDate.toISOString().split("T")[0],
      puntiGuadagnati: POINTS_PER_BORROW,
      puntiTotali: updatedUser?.points,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function getLoanById(req: Request, res: Response) {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true } },
      },
    });

    if (!loan) {
      return res.status(404).json({ message: "Noleggio non trovato" });
    }

    return res.json(loan);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function returnLoan(req: Request, res: Response) {
  try {
    const loan = await prisma.loan.findUnique({ where: { id: Number(req.params.id) } });
    if (!loan) return res.status(404).json({ message: "Noleggio non trovato" });
    if (loan.returned) {
      return res.json({
        message: "Libro gia restituito",
        loan,
      });
    }

    const POINTS_PER_RETURN = 10;

    const [updatedLoan] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: Number(req.params.id) },
        data: { returned: true },
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: loan.userId },
        data: { points: { increment: POINTS_PER_RETURN } },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: loan.userId },
      select: { points: true },
    });

    return res.json({
      message: "Libro restituito con successo",
      loan: updatedLoan,
      puntiGuadagnati: POINTS_PER_RETURN,
      puntiTotali: user?.points,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}
