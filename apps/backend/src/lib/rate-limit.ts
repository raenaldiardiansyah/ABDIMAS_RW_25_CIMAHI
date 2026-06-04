import { createMiddleware } from "hono/factory";

import { tooManyRequests } from "./errors.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function readClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function createRateLimitMiddleware(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  return createMiddleware(async (c, next) => {
    const ip = readClientIp(c.req.raw);
    const sessionUser = c.get("sessionUser") as { id?: string } | undefined;
    const bucketKey = `${input.key}:${sessionUser?.id ?? ip}`;
    const now = Date.now();
    const current = buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + input.windowMs });
      await next();
      return;
    }

    if (current.count >= input.limit) {
      throw tooManyRequests("Rate limit exceeded");
    }

    current.count += 1;
    buckets.set(bucketKey, current);
    await next();
  });
}
