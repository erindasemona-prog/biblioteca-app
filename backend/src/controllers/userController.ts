import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
      },
    });

    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function getUserLoans(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    const loans = await prisma.loan.findMany({
      where: { userId: Number(req.params.id) },
      include: {
        book: { select: { id: true, title: true, author: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return res.json(loans);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function getUserOpenLoans(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    const loans = await prisma.loan.findMany({
      where: { userId: Number(req.params.id), returned: false },
      include: {
        book: { select: { id: true, title: true, author: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return res.json(loans);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function getUserPoints(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true, points: true },
    });
    if (!user) return res.status(404).json({ message: "Utente non trovato" });
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}
