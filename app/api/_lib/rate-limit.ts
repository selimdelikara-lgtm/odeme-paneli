import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type BucketState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, BucketState>();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const memoryRateLimit = (
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

export const rateLimit = async (
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfterMs: number }> => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return memoryRateLimit(key, limit, windowMs);
  }

  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const now = Date.now();
  const nextResetAt = new Date(now + windowMs).toISOString();

  const { data: existing, error: fetchError } = await adminClient
    .from("security_rate_limits")
    .select("count, reset_at")
    .eq("key", key)
    .maybeSingle();

  if (fetchError) {
    return memoryRateLimit(key, limit, windowMs);
  }

  if (!existing || new Date(existing.reset_at).getTime() <= now) {
    const { error: upsertError } = await adminClient.from("security_rate_limits").upsert(
      {
        key,
        count: 1,
        reset_at: nextResetAt,
      },
      { onConflict: "key" }
    );

    if (upsertError) {
      return memoryRateLimit(key, limit, windowMs);
    }

    return {
      ok: true,
      retryAfterMs: windowMs,
    };
  }

  const resetAtMs = new Date(existing.reset_at).getTime();
  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterMs: Math.max(resetAtMs - now, 0),
    };
  }

  const { error: updateError } = await adminClient
    .from("security_rate_limits")
    .update({
      count: existing.count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (updateError) {
    return memoryRateLimit(key, limit, windowMs);
  }

  return {
    ok: true,
    retryAfterMs: Math.max(resetAtMs - now, 0),
  };
};
