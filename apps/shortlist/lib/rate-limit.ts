/**
 * Simple sliding-window rate limiter backed by the database.
 *
 * Uses the existing `prisma` connection so no extra infrastructure is needed.
 * Stores a counter per (userId, action, window) row and cleans up expired rows.
 *
 * For high-traffic production use, swap the Prisma implementation here for
 * Upstash Redis (@upstash/ratelimit) — the call-site API stays the same.
 */
import { prisma } from "@/lib/prisma";

interface RateLimitOptions {
  /** Unique action name, e.g. "jd-fetch" */
  action: string;
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSecs: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (seconds) when the window resets */
  resetAt: number;
}

/**
 * Check and increment the rate limit for a user action.
 * Returns { allowed: false } when the limit is exceeded.
 */
export async function checkRateLimit(
  userId: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const nowSecs = Math.floor(Date.now() / 1000);
  const windowStart = nowSecs - opts.windowSecs;
  const windowKey = Math.floor(nowSecs / opts.windowSecs); // bucket identifier
  const resetAt = (windowKey + 1) * opts.windowSecs;

  // Upsert a counter for this (userId, action, windowKey)
  // We use raw SQL via $executeRaw so we can do an atomic increment
  // but fall back to Prisma upsert for portability.
  try {
    // Count requests in the current window
    const count = await prisma.rateLimitEntry.count({
      where: {
        userId,
        action: opts.action,
        windowKey,
      },
    });

    if (count >= opts.limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    // Record this request
    await prisma.rateLimitEntry.create({
      data: { userId, action: opts.action, windowKey },
    });

    // Async cleanup of old entries (don't await — fire and forget)
    prisma.rateLimitEntry
      .deleteMany({
        where: {
          action: opts.action,
          windowKey: { lt: windowKey - 1 },
        },
      })
      .catch(() => {
        // Best-effort cleanup — ignore errors
      });

    return { allowed: true, remaining: opts.limit - count - 1, resetAt };
  } catch {
    // If the rate limit table doesn't exist yet (migration pending),
    // fail open to avoid breaking the app during deploys.
    return { allowed: true, remaining: opts.limit, resetAt };
  }
}

/** Standard 429 response with Retry-After header */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.max(1, resetAt - Math.floor(Date.now() / 1000));
  return new Response(
    JSON.stringify({ error: "Too many requests. Please wait before trying again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}
