interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class MemoryRateLimiter {
  private requests = new Map<string, { count: number; resetAt: number }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (record && now > record.resetAt) {
      this.requests.delete(identifier);
    }

    const currentRecord = this.requests.get(identifier);

    if (!currentRecord) {
      const resetAt = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: resetAt,
      };
    }

    if (currentRecord.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: currentRecord.resetAt,
      };
    }

    currentRecord.count += 1;
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - currentRecord.count,
      reset: currentRecord.resetAt,
    };
  }
}

// Rate limiters configured with thresholds (60s window)
export const loginRateLimiter = new MemoryRateLimiter(5, 60 * 1000);
export const signupRateLimiter = new MemoryRateLimiter(5, 60 * 1000);
export const messagingRateLimiter = new MemoryRateLimiter(10, 60 * 1000);

// Aliases matching naming conventions
export const loginRateLimit = loginRateLimiter;
export const signupRateLimit = signupRateLimiter;
export const messagingRateLimit = messagingRateLimiter;

