import { rateLimit } from "../../_lib/rate-limit";
import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getClientIp,
  getServerSupabaseEnv,
  getUserActiveStatus,
  isSameOriginRequest,
  jsonError,
  jsonOk,
  readJsonBody,
} from "../../_lib/server";

type SignedUrlsPayload = {
  paths?: unknown;
};

const MAX_SIGNED_URL_PATHS = 100;
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("Gecersiz istek kaynagi.", 403);
  }

  const env = getServerSupabaseEnv();
  if (!env) {
    return jsonError("Sunucu ortam degiskenleri eksik.", 500);
  }

  const token = getBearerToken(request);
  if (!token) {
    return jsonError("Yetkilendirme bilgisi eksik.", 401);
  }

  const { body, error: bodyError } = await readJsonBody<SignedUrlsPayload>(
    request,
    24 * 1024
  );
  if (bodyError) return bodyError;

  const rawPaths = Array.isArray(body?.paths) ? body.paths : [];
  const paths = Array.from(
    new Set(
      rawPaths
        .filter((path): path is string => typeof path === "string")
        .map((path) => path.trim())
        .filter((path) => path && path.length <= 512)
    )
  ).slice(0, MAX_SIGNED_URL_PATHS);

  if (!paths.length) {
    return jsonOk({ urls: {} });
  }

  const authClient = createAuthedServerClient(env, token);
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonError("Kullanici dogrulanamadi.", 401);
  }

  const clientIp = getClientIp(request);
  const limiter = await rateLimit(
    `invoice_signed_urls:${clientIp}:${user.id}`,
    60,
    60 * 1000
  );
  if (!limiter.ok) {
    return jsonError("Cok fazla istek yapildi. Biraz sonra tekrar dene.", 429);
  }

  const adminClient = createAdminServerClient(env);
  const isActive = await getUserActiveStatus(adminClient, user.id);
  if (!isActive) {
    return jsonError("Hesabin gecici olarak pasiflestirildi.", 403);
  }

  const { data: ownedAttachments, error: attachmentsError } = await adminClient
    .from("fatura_ekleri")
    .select("path")
    .eq("user_id", user.id)
    .in("path", paths);

  if (attachmentsError) {
    return jsonError("Fatura linkleri hazirlanamadi.", 500);
  }

  const ownedPaths = ((ownedAttachments || []) as Array<{ path: string | null }>)
    .map((item) => item.path)
    .filter((path): path is string => Boolean(path));

  if (!ownedPaths.length) {
    return jsonOk({ urls: {} });
  }

  const { data: signedUrls, error: signedUrlError } = await adminClient.storage
    .from("faturalar")
    .createSignedUrls(ownedPaths, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (signedUrlError) {
    return jsonError("Fatura linkleri hazirlanamadi.", 500);
  }

  const urls = Object.fromEntries(
    (signedUrls || [])
      .map((item) => [item.path, item.signedUrl])
      .filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === "string" && typeof entry[1] === "string"
      )
  );

  return jsonOk({ urls, expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS });
}
