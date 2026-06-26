import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getServerSupabaseEnv,
  getUserActiveStatus,
  jsonError,
  jsonOk,
} from "../../_lib/server";

export async function GET(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonError("Sunucu ortam değişkenleri eksik.", 500);

  const token = getBearerToken(request);
  if (!token) return jsonError("Yetkilendirme bilgisi eksik.", 401);

  const authClient = createAuthedServerClient(env, token);
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return jsonError("Kullanıcı doğrulanamadı.", 401);

  const adminClient = createAdminServerClient(env);
  const isActive = await getUserActiveStatus(adminClient, user.id);
  return jsonOk({ isActive });
}
