import { RateLimitExceededError } from '../../../application/errors/auth-errors';
import type { OtpRateLimiter } from '../../../application/ports/otp-rate-limiter';

interface RedisCommandClient {
  sendCommand(args: string[]): Promise<unknown>;
}

const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end

local ttl = redis.call('TTL', KEYS[1])
if current > tonumber(ARGV[2]) then
  return {0, current, ttl}
end

return {1, current, ttl}
`;

export class RedisOtpRateLimiter implements OtpRateLimiter {
  constructor(
    private readonly redis: RedisCommandClient,
    private readonly maxAttemptsPerWindow = 3,
    private readonly windowSeconds = 60 * 60,
  ) {}

  async assertCanRequestOtp(phone: string): Promise<void> {
    const key = `otp:request:${phone}:hour`;
    const result = await this.redis.sendCommand([
      'EVAL',
      RATE_LIMIT_SCRIPT,
      '1',
      key,
      String(this.windowSeconds),
      String(this.maxAttemptsPerWindow),
    ]);
    const [allowed, _count, ttl] = parseRateLimitResult(result);

    if (!allowed) {
      throw new RateLimitExceededError(
        `Too many OTP requests. Try again in ${Math.max(ttl, 1)} seconds.`,
      );
    }
  }
}

function parseRateLimitResult(result: unknown): [allowed: boolean, count: number, ttl: number] {
  if (!Array.isArray(result) || result.length < 3) {
    throw new Error('Unexpected Redis rate-limit response');
  }

  return [Number(result[0]) === 1, Number(result[1]), Number(result[2])];
}
