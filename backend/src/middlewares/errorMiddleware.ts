import { ErrorRequestHandler } from "express";
import multer from "multer";

type HttpError = Error & {
  status?: number;
};

export const errorMiddleware: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const status = err.status ?? (err instanceof multer.MulterError ? 400 : 500);
  const message = status === 500 ? "Internal server error" : err.message;

  if (status === 500) {
    console.error(process.env.NODE_ENV === "production" ? err.message : err);
  }

  res.status(status).json({ message });
};
