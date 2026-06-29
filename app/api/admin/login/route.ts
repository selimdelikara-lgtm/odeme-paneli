import { createHash, scryptSync, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "../../_lib/rate-limit";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  hashIp,
  hasSecureAdminCookieSecret,
  writeAdminAuditLog,
} from "../../_lib/admin";
import {
  createAdminServerClient,
  getClientIp,
  getServerSupabaseEnv,
  isSameOriginRequest,
  jsonError,
  readJsonBody,
} from "../../_lib/server";

type LoginBody = {
  username?: string;
  password?: string;
};

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const hashValue = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 16);
const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};
const verifyPasswordHash = (password: string, storedHash: string) => {
  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const computed = scryptSync(password, salt, 64).toString("base64url");
  return safeCompare(computed, hash);
};

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  if (!isSameOriginRequest(request)) return jsonError("Geçersiz istek kaynağı.", 403);

  const { body, error } = await readJsonBody<LoginBody>(request, 4096);
  if (error) return error;

  const username = normalizeUsername(body?.username || "");
  const password = body?.password || "";
  const clientIp = getClientIp(request);
  const usernameHash = hashValue(username || "empty");
  const expectedUsername = normalizeUsername(process.env.ADMIN_PANEL_USERNAME || "");
  const expectedPasswordHash = process.env.ADMIN_PANEL_PASSWORD_HASH || "";
  const adminEmail = (process.env.ADMIN_PANEL_EMAIL || "selim.delikara@gmail.com").trim().toLowerCase();
  const adminUserId = (process.env.ADMIN_PANEL_USER_ID || "").trim();

  if (!expectedUsername || !expectedPasswordHash) {
    return jsonError("Admin giriş ortam değişkenleri eksik.", 500);
  }
  if (!hasSecureAdminCookieSecret()) {
    return jsonError("Admin oturum anahtarı production için güvenli ayarlanmamış.", 500);
  }

  if (!username || !password || username.length > 80 || password.length > 256) {
    return jsonError("Kullanıcı adı veya şifre geçersiz.", 400);
  }

  const ipLimiter = await rateLimit(`admin-login-ip:${clientIp}`, 12, 15 * 60 * 1000);
  const accountLimiter = await rateLimit(`admin-login-account:${usernameHash}`, 6, 15 * 60 * 1000);
  if (!ipLimiter.ok || !accountLimiter.ok) {
    return jsonError("Çok fazla admin giriş denemesi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const adminClient = createAdminServerClient(env);

  if (!safeCompare(username, expectedUsername) || !verifyPasswordHash(password, expectedPasswordHash)) {
    await writeAdminAuditLog({
      adminClient,
      action: "admin_login_failed",
      entityType: "admin_auth",
      entityId: usernameHash,
      newValue: { username_hash: usernameHash, ip_hash: hashIp(clientIp) },
      request,
    });
    return jsonError("Admin kullanıcı adı veya şifre hatalı.", 401);
  }

  if (adminUserId) {
    await adminClient.from("admin_user").upsert({
      user_id: adminUserId,
      email: adminEmail,
      is_active: true,
    });
  }

  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_user")
    .select("*")
    .eq("email", adminEmail)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !adminUser) {
    await writeAdminAuditLog({
      adminClient,
      action: "admin_login_denied",
      entityType: "admin_auth",
      entityId: usernameHash,
      newValue: { username_hash: usernameHash, reason: "admin_user_missing" },
      request,
    });
    return jsonError("Admin kullanıcı kaydı aktif değil.", 403);
  }

  await adminClient
    .from("admin_user")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", adminUser.id);

  await writeAdminAuditLog({
    adminClient,
    adminUserId: adminUser.id,
    action: "admin_login_success",
    entityType: "admin_auth",
    entityId: adminUser.id,
    newValue: { username },
    request,
  });

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_ACCESS_COOKIE, createAdminSessionToken(adminUser.id), adminCookieOptions);
  response.cookies.set(ADMIN_REFRESH_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
}
