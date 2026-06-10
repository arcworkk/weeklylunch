import { ErrorRequestHandler } from "express";

type HttpError = Error & {
  status?: number;
};

export const errorMiddleware: ErrorRequestHandler = (err: HttpError, _req, res, _next) => {
  const status = err.status ?? 500;
  const message = status === 500 ? "Internal server error" : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ message });
};
