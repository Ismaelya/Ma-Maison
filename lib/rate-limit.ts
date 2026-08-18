import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://placeholder.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "placeholder",
});

export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "@upstash/ratelimit/login",
  analytics: true,
});

export const signupRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "@upstash/ratelimit/signup",
  analytics: true,
});

export const messagingRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "@upstash/ratelimit/messaging",
  analytics: true,
});

// Aliases matching naming conventions
export const loginRateLimit = loginRateLimiter;
export const signupRateLimit = signupRateLimiter;
export const messagingRateLimit = messagingRateLimiter;

