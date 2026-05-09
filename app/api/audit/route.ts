import { rateLimit } from "../_lib/rate-limit";
import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getClientIp,
  getServerSupabaseEnv,
  jsonError,
  jsonOk,
} from "../_lib/server";

export async function GET(request: Request) {
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

  const limiter = await rateLimit(`audit-read:${getClientIp(request)}:${user.id}`, 30, 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla işlem geçmişi isteği yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const adminClient = createAdminServerClient(env);
  const { data, error } = await adminClient
    .from("audit_logs")
    .select("id, title, detail, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return jsonError("İşlem geçmişi alınamadı.", 500);
  }

  return jsonOk(
    {
      items: (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        createdAt: item.created_at,
      })),
    }
  );
}
