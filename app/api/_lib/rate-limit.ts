type BucketState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, BucketState>();

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } => {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      ok: true,
      retryAfterMs: windowMs,
    };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterMs: current.resetAt - now,
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    ok: true,
    retryAfterMs: current.resetAt - now,
  };
};
