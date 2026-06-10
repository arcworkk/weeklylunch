import { NextFunction, Request, Response } from "express";
import { buildPrepSummary } from "../services/prepSummaryService";

const makeError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

export const getPrepSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      throw makeError("Unauthorized", 401);
    }

    const summary = await buildPrepSummary(req.params.id, req.user.userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
