import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if ((!url || !token) && process.env.NODE_ENV === "production") {
    throw new Error(
      "UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN doivent être définies en production. " +
        "Configurez-les dans Vercel > Project Settings > Environment Variables."
    );
  }

  redis = new Redis({
    url: url || "https://placeholder.upstash.io",
    token: token || "placeholder",
  });
  return redis;
}

function createRateLimiter(
  prefix: string,
  tokens: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
) {
  let instance: Ratelimit | null = null;

  const getInstance = () => {
    if (!instance) {
      instance = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(tokens, window),
        prefix,
        analytics: true,
      });
    }
    return instance;
  };

  return {
    limit: (identifier: string) => getInstance().limit(identifier),
  };
}

export const loginRateLimiter = createRateLimiter(
  "@upstash/ratelimit/login",
  5,
  "60 s"
);

export const signupRateLimiter = createRateLimiter(
  "@upstash/ratelimit/signup",
  5,
  "60 s"
);

export const messagingRateLimiter = createRateLimiter(
  "@upstash/ratelimit/messaging",
  10,
  "60 s"
);

// Aliases matching naming conventions
export const loginRateLimit = loginRateLimiter;
export const signupRateLimit = signupRateLimiter;
export const messagingRateLimit = messagingRateLimiter;
