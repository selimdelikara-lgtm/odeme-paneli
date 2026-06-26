import { rateLimit } from "../../_lib/rate-limit";
import { writeAuditLog } from "../../_lib/audit";
import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getClientIp,
  getServerSupabaseEnv,
  getUserActiveStatus,
  jsonError,
  jsonOk,
  readJsonBody,
} from "../../_lib/server";

type ReorderPayload = {
  ids?: number[];
};

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const token = getBearerToken(request);
  if (!token) {
    return jsonError("Yetkilendirme bilgisi eksik.", 401);
  }

  const authClient = createAuthedServerClient(env, token);

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonError("Kullanıcı doğrulanamadı.", 401);
  }

  const adminClient = createAdminServerClient(env);
  const isActive = await getUserActiveStatus(adminClient, user.id);
  if (!isActive) {
    return jsonError("Hesabın geçici olarak pasifleştirildi.", 403);
  }

  const clientIp = getClientIp(request);
  const limiter = await rateLimit(`reorder:${clientIp}:${user.id}`, 30, 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla sıralama işlemi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const { body, error: bodyError } = await readJsonBody<ReorderPayload>(request, 16 * 1024);
  if (bodyError) return bodyError;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((item) => Number.isInteger(item)) : [];

  if (!ids.length || ids.length > 250) {
    return jsonError("Geçersiz sıralama isteği.", 400);
  }

  const updates = ids.map((id, index) =>
    adminClient
      .from("odemeler")
      .update({ sira: index + 1 })
      .eq("user_id", user.id)
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((item) => item.error);
  if (failed?.error) {
    return jsonError("Sıralama kaydedilemedi.", 500);
  }

  await writeAuditLog({
    adminClient,
    userId: user.id,
    title: "Kayıt sırası değiştirildi",
    detail: `${ids.length} kayıt yeniden sıralandı.`,
    source: "reorder_api",
    request,
  });

  return jsonOk({ ok: true });
}
