import { createHash, createHmac, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
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
  getUserAgent,
  getServerSupabaseEnv,
  isSameOriginRequest,
  jsonError,
  jsonOk,
  readJsonBody,
} from "../../_lib/server";

type LoginBody = {
  username?: string;
  password?: string;
  challengeId?: string;
  code?: string;
};

type ResendResponse = {
  id?: string;
  name?: string;
  message?: string;
  error?: string;
};

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const hashValue = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 16);
const normalizeCode = (value: string) => value.replace(/\D/g, "").slice(0, 6);
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
const getOtpSecret = () => process.env.ADMIN_OTP_SECRET || process.env.ADMIN_COOKIE_SECRET || "odedimi-dev-otp-secret";
const hashOtpCode = (adminUserId: string, code: string) =>
  createHmac("sha256", getOtpSecret()).update(`${adminUserId}:${code}`).digest("hex");
const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
};
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const sendAdminOtpEmail = async (email: string, code: string) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return { ok: false, error: "missing_resend_config" };
  }

  const subject = "Ödedimi admin giriş doğrulama kodu";
  const text = [
    "Ödedimi admin paneline giriş için doğrulama kodun:",
    "",
    code,
    "",
    "Bu kod 10 dakika geçerlidir. Bu isteği sen başlatmadıysan şifreni değiştir.",
  ].join("\n");
  const html = [
    "<div style=\"font-family:Arial,sans-serif;line-height:1.55;color:#172033\">",
    "<h2>Ödedimi admin giriş doğrulama kodu</h2>",
    "<p>Admin paneline giriş için doğrulama kodun:</p>",
    `<p style="font-size:30px;font-weight:800;letter-spacing:6px;margin:18px 0">${escapeHtml(code)}</p>`,
    "<p>Bu kod 10 dakika geçerlidir.</p>",
    "<p style=\"color:#64748b\">Bu isteği sen başlatmadıysan admin şifreni değiştir.</p>",
    "</div>",
  ].join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text,
      html,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as ResendResponse;
  return {
    ok: response.ok,
    id: payload.id,
    error: payload.message || payload.error || payload.name || "unknown",
  };
};

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  if (!isSameOriginRequest(request)) return jsonError("Geçersiz istek kaynağı.", 403);

  const { body, error } = await readJsonBody<LoginBody>(request, 4096);
  if (error) return error;

  const username = normalizeUsername(body?.username || "");
  const password = body?.password || "";
  const challengeId = typeof body?.challengeId === "string" ? body.challengeId.trim() : "";
  const code = normalizeCode(body?.code || "");
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

  const adminClient = createAdminServerClient(env);

  if (challengeId || code) {
    if (!challengeId || code.length !== 6) {
      return jsonError("Doğrulama kodu geçersiz.", 400);
    }

    const verifyLimiter = await rateLimit(`admin-login-otp:${clientIp}:${challengeId}`, 8, 15 * 60 * 1000);
    if (!verifyLimiter.ok) {
      return jsonError("Çok fazla kod denemesi yapıldı. Biraz sonra tekrar dene.", 429);
    }

    const { data: challenge, error: challengeError } = await adminClient
      .from("admin_login_otps")
      .select("*")
      .eq("id", challengeId)
      .is("consumed_at", null)
      .maybeSingle();

    if (
      challengeError ||
      !challenge ||
      challenge.expires_at < new Date().toISOString() ||
      challenge.attempts >= 5
    ) {
      await writeAdminAuditLog({
        adminClient,
        action: "admin_login_otp_denied",
        entityType: "admin_auth",
        entityId: challengeId,
        newValue: { reason: "challenge_invalid_or_expired", ip_hash: hashIp(clientIp) },
        request,
      });
      return jsonError("Doğrulama kodu süresi dolmuş veya geçersiz.", 401);
    }

    const expectedHash = hashOtpCode(challenge.admin_user_id, code);
    if (!safeCompare(expectedHash, challenge.code_hash)) {
      await adminClient
        .from("admin_login_otps")
        .update({ attempts: challenge.attempts + 1 })
        .eq("id", challenge.id);
      await writeAdminAuditLog({
        adminClient,
        adminUserId: challenge.admin_user_id,
        action: "admin_login_otp_failed",
        entityType: "admin_auth",
        entityId: challenge.id,
        newValue: { attempts: challenge.attempts + 1, ip_hash: hashIp(clientIp) },
        request,
      });
      return jsonError("Doğrulama kodu hatalı.", 401);
    }

    const { data: adminUser, error: adminError } = await adminClient
      .from("admin_user")
      .select("*")
      .eq("id", challenge.admin_user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !adminUser) {
      return jsonError("Admin kullanıcı kaydı aktif değil.", 403);
    }

    await adminClient
      .from("admin_login_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challenge.id);
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
      newValue: { otp_verified: true },
      request,
    });

    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ADMIN_ACCESS_COOKIE, createAdminSessionToken(adminUser.id), adminCookieOptions);
    response.cookies.set(ADMIN_REFRESH_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
    return response;
  }

  if (!username || !password || username.length > 80 || password.length > 256) {
    return jsonError("Kullanıcı adı veya şifre geçersiz.", 400);
  }

  const ipLimiter = await rateLimit(`admin-login-ip:${clientIp}`, 12, 15 * 60 * 1000);
  const accountLimiter = await rateLimit(`admin-login-account:${usernameHash}`, 6, 15 * 60 * 1000);
  if (!ipLimiter.ok || !accountLimiter.ok) {
    return jsonError("Çok fazla admin giriş denemesi yapıldı. Biraz sonra tekrar dene.", 429);
  }

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

  const otpLimiter = await rateLimit(`admin-login-otp-send:${clientIp}:${adminUser.id}`, 4, 15 * 60 * 1000);
  if (!otpLimiter.ok) {
    return jsonError("Çok fazla doğrulama kodu istendi. Biraz sonra tekrar dene.", 429);
  }

  const otpCode = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { data: otpRow, error: otpError } = await adminClient
    .from("admin_login_otps")
    .insert({
      admin_user_id: adminUser.id,
      email: adminEmail,
      code_hash: hashOtpCode(adminUser.id, otpCode),
      expires_at: expiresAt,
      request_ip_hash: hashIp(clientIp),
      user_agent: getUserAgent(request),
    })
    .select("id")
    .single();

  if (otpError || !otpRow) {
    return jsonError("Doğrulama kodu oluşturulamadı.", 500);
  }

  const emailResult = await sendAdminOtpEmail(adminEmail, otpCode);
  if (!emailResult.ok) {
    await writeAdminAuditLog({
      adminClient,
      adminUserId: adminUser.id,
      action: "admin_login_otp_send_failed",
      entityType: "admin_auth",
      entityId: otpRow.id,
      newValue: { provider_error: emailResult.error },
      request,
    });
    return jsonError("Doğrulama e-postası gönderilemedi. Resend ayarlarını kontrol et.", 502);
  }

  await writeAdminAuditLog({
    adminClient,
    adminUserId: adminUser.id,
    action: "admin_login_otp_sent",
    entityType: "admin_auth",
    entityId: otpRow.id,
    newValue: { username, email: maskEmail(adminEmail), provider: "resend", provider_id: emailResult.id },
    request,
  });

  return jsonOk({
    ok: true,
    requiresOtp: true,
    challengeId: otpRow.id,
    email: maskEmail(adminEmail),
    expiresIn: 10 * 60,
  });
}
