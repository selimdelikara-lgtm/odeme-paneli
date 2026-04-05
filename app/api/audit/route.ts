import { writeAuditLog } from "../_lib/audit";
import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
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

type PostBody = {
  title?: string;
  detail?: string;
  source?: string;
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

  const body = (await request.json().catch(() => null)) as PostBody | null;
  const title = body?.title?.trim() || "";
  const detail = body?.detail?.trim() || "";
  const source = body?.source?.trim() || "client";

  if (!title || !detail) {
    return jsonError("Eksik audit log verisi.", 400);
  }

  const adminClient = createAdminServerClient(env);

  const error = await writeAuditLog({
    adminClient,
    userId: user.id,
    title: title.slice(0, 120),
    detail: detail.slice(0, 400),
    source: source.slice(0, 32),
    request,
  });

  if (error) {
    return jsonError("İşlem geçmişi yazılamadı.", 500);
  }

  return jsonOk({ ok: true });
}
