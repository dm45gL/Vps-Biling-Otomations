// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

// Generic error handler
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction // underscore to satisfy ESLint no-unused-vars
) => {
  // Tentukan message secara aman
  const message = err instanceof Error ? err.message : "Unknown error";

  // Optional: log full stack if it's an Error
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }

  // Kirim response
  res.status(500).json({
    success: false,
    error: message,
  });
};
