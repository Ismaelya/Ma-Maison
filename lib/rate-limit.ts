export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

// In-memory sliding window store (compatible Vercel Edge & Node.js)
const memoryStore = new Map<string, RateLimitRecord>();

export class RateLimiter {
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const record = memoryStore.get(identifier);

    if (!record || now > record.resetAt) {
      const resetAt = now + this.windowMs;
      memoryStore.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: resetAt,
      };
    }

    if (record.count >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: record.resetAt,
      };
    }

    record.count += 1;
    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - record.count,
      reset: record.resetAt,
    };
  }

  reset(identifier: string) {
    memoryStore.delete(identifier);
  }
}

// Global instances as per Sprint 9 specifications
export const loginRateLimiter = new RateLimiter(5, 60000); // 5 tentatives / min
export const signupRateLimiter = new RateLimiter(5, 60000); // 5 tentatives / min (par IP)
export const messagingRateLimiter = new RateLimiter(10, 60000); // 10 messages / min (anti-spam)
