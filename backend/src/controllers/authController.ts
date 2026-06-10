import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { signJwt } from "../utils/jwt";

const sanitizeUser = <T extends { passwordHash: string }>(user: T) => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

const makeError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!email || !password) {
      throw makeError("Email and password are required", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw makeError("Email is already used", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash }
    });
    const token = signJwt(user.id);

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!email || !password) {
      throw makeError("Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw makeError("Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw makeError("Invalid credentials", 401);
    }

    const token = signJwt(user.id);

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw makeError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw makeError("User not found", 404);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
