import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";

const makeError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

export const getAdminEmail = () =>
  String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

export const adminMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      throw makeError("Unauthorized", 401);
    }

    const adminEmail = getAdminEmail();

    if (!adminEmail) {
      throw makeError("Admin access is not configured", 503);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true }
    });

    if (!user || user.email.toLowerCase() !== adminEmail) {
      throw makeError("Admin access required", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
