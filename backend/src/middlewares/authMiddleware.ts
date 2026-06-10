import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authorization.replace("Bearer ", "").trim();

  try {
    const payload = verifyJwt(token);
    req.user = { userId: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
