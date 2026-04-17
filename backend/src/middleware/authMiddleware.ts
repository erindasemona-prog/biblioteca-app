import { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userIdHeader = req.header("x-user-id");

  if (!userIdHeader) {
    return res.status(401).json({ message: "Non autorizzato" });
  }

  const userId = Number(userIdHeader);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: "x-user-id non valido" });
  }

  return next();
}
