export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitExceededError extends Error {
  constructor(message = 'Too many OTP requests. Try again later.') {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

export class InvalidOtpError extends Error {
  constructor(message = 'Invalid or expired OTP') {
    super(message);
    this.name = 'InvalidOtpError';
  }
}
