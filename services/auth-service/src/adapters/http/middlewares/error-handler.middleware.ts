import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const statusCode = message.includes('Invalid or expired OTP') ? 401 : 400;

  response.status(statusCode).json({ message });
};
