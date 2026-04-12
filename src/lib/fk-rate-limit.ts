import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  success: boolean;
  remaining: number;
  retryAfterMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function createRateLimiter(
  name: string,
  maxRequests: number,
  windowMs: number,
) {
  if (!stores.has(name)) stores.set(name, new Map());
  const store = stores.get(name)!;

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return {
          allowed: true,
          success: true,
          remaining: maxRequests - 1,
          retryAfterMs: 0,
        };
      }

      if (entry.count >= maxRequests) {
        const retryAfterMs = entry.resetAt - now;
        return { allowed: false, success: false, remaining: 0, retryAfterMs };
      }

      entry.count++;
      return {
        allowed: true,
        success: true,
        remaining: maxRequests - entry.count,
        retryAfterMs: 0,
      };
    },
  };
}

export const loginLimiter = createRateLimiter("login", 5, 15 * 60 * 1000);
export const passwordLimiter = createRateLimiter("password", 5, 15 * 60 * 1000);
export const uploadLimiter = createRateLimiter("upload", 10, 60 * 60 * 1000);
export const apiLimiter = createRateLimiter("api", 100, 60 * 1000);

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitResponse(retryAfterMs?: number): NextResponse {
  const retryAfter = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 60;
  return NextResponse.json(
    { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}
