import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getClientIp,
  getServerSupabaseEnv,
  getUserAgent,
  jsonError,
  jsonOk,
} from "../_lib/server";

const MAX_ACTIVE_SESSIONS = 2;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SessionBody = {
  deviceId?: string;
  reauthenticated?: boolean;
};

const isValidDeviceId = (value: unknown): value is string =>
  typeof value === "string" && value.length >= 16 && value.length <= 120;

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonError("Sunucu ortam değişkenleri eksik.", 500);

  const token = getBearerToken(request);
  if (!token) return jsonError("Yetkilendirme bilgisi eksik.", 401);

  const body = (await request.json().catch(() => ({}))) as SessionBody;
  if (!isValidDeviceId(body.deviceId)) {
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

  await adminClient.from("user_sessions").delete().lt("expires_at", nowIso);

  const { data: existing, error: existingError } = await adminClient
    .from("user_sessions")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("device_id", body.deviceId)
    .maybeSingle();

  if (existingError) return jsonError("Oturum kontrolü yapılamadı.", 500);

  if (existing) {
    const expired = new Date(existing.expires_at).getTime() <= now.getTime();
    if (expired && !body.reauthenticated) {
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

  if (countError) return jsonError("Aktif oturumlar kontrol edilemedi.", 500);
  if ((count ?? 0) >= MAX_ACTIVE_SESSIONS) {
    return jsonError("Bu hesap aynı anda en fazla 2 cihazda açık kalabilir.", 409);
  }

  const { error: insertError } = await adminClient.from("user_sessions").insert({
    user_id: user.id,
    device_id: body.deviceId,
    user_agent: getUserAgent(request),
    ip: getClientIp(request),
    expires_at: expiresAt,
  });

  if (insertError) return jsonError("Oturum kaydı oluşturulamadı.", 500);
  return jsonOk({ ok: true, expiresAt });
}

export async function DELETE(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonOk({ ok: true });

  const token = getBearerToken(request);
  if (!token) return jsonOk({ ok: true });

  const body = (await request.json().catch(() => ({}))) as SessionBody;
  if (!isValidDeviceId(body.deviceId)) return jsonOk({ ok: true });

  const authClient = createAuthedServerClient(env, token);
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return jsonOk({ ok: true });

  await createAdminServerClient(env)
    .from("user_sessions")
    .delete()
    .eq("user_id", user.id)
    .eq("device_id", body.deviceId);

  return jsonOk({ ok: true });
}
