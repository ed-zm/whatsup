import type { ErrorRequestHandler } from 'express';
import {
  InvalidOtpError,
  RateLimitExceededError,
  ValidationError,
} from '../../../application/errors/auth-errors';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const statusCode = getStatusCode(error);

  response.status(statusCode).json({ message });
};

function getStatusCode(error: unknown): number {
  if (error instanceof RateLimitExceededError) {
    return 429;
  }

  if (error instanceof InvalidOtpError) {
    return 401;
  }

  if (error instanceof ValidationError) {
    return 400;
  }

  return 500;
}
