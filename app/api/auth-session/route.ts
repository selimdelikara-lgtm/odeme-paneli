import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getClientIp,
  getServerSupabaseEnv,
  getUserAgent,
  jsonError,
  jsonOk,
  readJsonBody,
} from "../_lib/server";

const MAX_ACTIVE_SESSIONS = 2;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SessionBody = {
  deviceId?: string;
  reauthenticated?: boolean;
};

const isValidDeviceId = (value: unknown): value is string =>
  typeof value === "string" && value.length >= 16 && value.length <= 120;

const isMissingSessionTableError = (error: { code?: string; message?: string } | null) =>
  Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.toLowerCase().includes("user_sessions") ||
        error.message?.toLowerCase().includes("schema cache"))
  );

const fallbackSessionKey = (userId: string, deviceId: string) =>
  `auth-session:${userId}:${deviceId}`;

const fallbackSessionPrefix = (userId: string) => `auth-session:${userId}:%`;

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonError("Sunucu ortam değişkenleri eksik.", 500);

  const token = getBearerToken(request);
  if (!token) return jsonError("Yetkilendirme bilgisi eksik.", 401);

  const { body, error: bodyError } = await readJsonBody<SessionBody>(request, 4096);
  if (bodyError) return bodyError;
  const deviceId = body?.deviceId;
  const reauthenticated = body?.reauthenticated === true;
  if (!isValidDeviceId(deviceId)) {
    return jsonError("Cihaz oturumu doğrulanamadı.", 400);
  }

  const authClient = createAuthedServerClient(env, token);
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) return jsonError("Kullanıcı doğrulanamadı.", 401);

  const adminClient = createAdminServerClient(env);
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  const runRateLimitSessionFallback = async () => {
    const key = fallbackSessionKey(user.id, deviceId);
    const prefix = fallbackSessionPrefix(user.id);

    await adminClient.from("security_rate_limits").delete().lt("reset_at", nowIso).like("key", prefix);

    const { data: existingFallback, error: existingFallbackError } = await adminClient
      .from("security_rate_limits")
      .select("key, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (existingFallbackError) return jsonError("Oturum kontrolü yapılamadı.", 500);

    if (existingFallback) {
      const expired = new Date(existingFallback.reset_at).getTime() <= now.getTime();
      if (expired && !reauthenticated) {
        await adminClient.from("security_rate_limits").delete().eq("key", key);
        return jsonError("Oturum süresi doldu. Lütfen yeniden giriş yap.", 401);
      }

      if (expired) {
        await adminClient.from("security_rate_limits").upsert({ key, count: 1, reset_at: expiresAt });
        return jsonOk({ ok: true, expiresAt, fallback: true });
      }

      return jsonOk({ ok: true, expiresAt: existingFallback.reset_at, fallback: true });
    }

    const { count, error: countFallbackError } = await adminClient
      .from("security_rate_limits")
      .select("key", { count: "exact", head: true })
      .like("key", prefix)
      .gt("reset_at", nowIso);

    if (countFallbackError) return jsonError("Aktif oturumlar kontrol edilemedi.", 500);
    if ((count ?? 0) >= MAX_ACTIVE_SESSIONS) {
      return jsonError("Bu hesap aynı anda en fazla 2 cihazda açık kalabilir.", 409);
    }

    const { error: insertFallbackError } = await adminClient
      .from("security_rate_limits")
      .upsert({ key, count: 1, reset_at: expiresAt });

    if (insertFallbackError) return jsonError("Oturum kaydı oluşturulamadı.", 500);
    return jsonOk({ ok: true, expiresAt, fallback: true });
  };

  const { error: cleanupError } = await adminClient
    .from("user_sessions")
    .delete()
    .lt("expires_at", nowIso);
  if (isMissingSessionTableError(cleanupError)) return runRateLimitSessionFallback();

  const { data: existing, error: existingError } = await adminClient
    .from("user_sessions")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (isMissingSessionTableError(existingError)) return runRateLimitSessionFallback();
  if (existingError) return jsonError("Oturum kontrolü yapılamadı.", 500);

  if (existing) {
    const expired = new Date(existing.expires_at).getTime() <= now.getTime();
    if (expired && !reauthenticated) {
      await adminClient.from("user_sessions").delete().eq("id", existing.id);
      return jsonError("Oturum süresi doldu. Lütfen yeniden giriş yap.", 401);
    }

    const { error: updateError } = await adminClient
      .from("user_sessions")
      .update({
        last_seen_at: nowIso,
        user_agent: getUserAgent(request),
        ip: getClientIp(request),
        ...(expired ? { created_at: nowIso, expires_at: expiresAt } : {}),
      })
      .eq("id", existing.id);

    if (updateError) return jsonError("Oturum güncellenemedi.", 500);
    return jsonOk({ ok: true, expiresAt: expired ? expiresAt : existing.expires_at });
  }

  const { count, error: countError } = await adminClient
    .from("user_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gt("expires_at", nowIso);

  if (isMissingSessionTableError(countError)) return runRateLimitSessionFallback();
  if (countError) return jsonError("Aktif oturumlar kontrol edilemedi.", 500);
  if ((count ?? 0) >= MAX_ACTIVE_SESSIONS) {
    return jsonError("Bu hesap aynı anda en fazla 2 cihazda açık kalabilir.", 409);
  }

  const { error: insertError } = await adminClient.from("user_sessions").insert({
    user_id: user.id,
    device_id: deviceId,
    user_agent: getUserAgent(request),
    ip: getClientIp(request),
    expires_at: expiresAt,
  });

  if (isMissingSessionTableError(insertError)) return runRateLimitSessionFallback();
  if (insertError) return jsonError("Oturum kaydı oluşturulamadı.", 500);
  return jsonOk({ ok: true, expiresAt });
}

export async function DELETE(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonOk({ ok: true });

  const token = getBearerToken(request);
  if (!token) return jsonOk({ ok: true });

  const { body } = await readJsonBody<SessionBody>(request, 4096);
  const deviceId = body?.deviceId;
  if (!isValidDeviceId(deviceId)) return jsonOk({ ok: true });

  const authClient = createAuthedServerClient(env, token);
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return jsonOk({ ok: true });

  const adminClient = createAdminServerClient(env);
  const { error } = await adminClient
    .from("user_sessions")
    .delete()
    .eq("user_id", user.id)
    .eq("device_id", deviceId);

  if (isMissingSessionTableError(error)) {
    await adminClient
      .from("security_rate_limits")
      .delete()
      .eq("key", fallbackSessionKey(user.id, deviceId));
  }

  return jsonOk({ ok: true });
}
