import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email gia registrata" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        points: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
      },
    });

    return res.status(201).json({
      message: "Registrazione avvenuta con successo",
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function registerGet(req: Request, res: Response) {
  const name = req.query.name as string;
  const email = req.query.email as string;
  const password = req.query.password as string;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Usa /register con metodo POST oppure passa ?name=...&email=...&password=...",
    });
  }

  req.body = { name, email, password };
  return register(req, res);
}

function safeUser(user: { id: number; name: string; email: string; role: string; points: number }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points,
  };
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Utente non trovato" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Password sbagliata" });
    }

    return res.json({
      message: "Login riuscito",
      user: safeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore del server" });
  }
}

export async function loginGet(req: Request, res: Response) {
  const email = req.query.email as string;
  const password = req.query.password as string;

  if (!email || !password) {
    return res.status(400).json({
      message: "Usa /login con metodo POST oppure passa ?email=...&password=...",
    });
  }

  req.body = { email, password };
  return login(req, res);
}

export async function loginBrowser(req: Request, res: Response) {
  const email = req.query.email as string;
  const password = req.query.password as string;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.send("Utente non trovato");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.send("Password sbagliata");
    }

    return res.send(`Login riuscito. Benvenuta ${user.name}`);
  } catch (error) {
    console.error(error);
    return res.send("Errore del server");
  }
}
