import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { rateLimit } from "../../_lib/rate-limit";
import {
  createAdminServerClient,
  getClientIp,
  getServerSupabaseEnv,
  getUserActiveStatus,
  jsonError,
  jsonOk,
  readJsonBody,
} from "../../_lib/server";
import type { Database } from "@/lib/database.types";

type LoginBody = {
  email?: string;
  password?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashValue = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 16);

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonError("Sunucu ortam değişkenleri eksik.", 500);

  const { body, error } = await readJsonBody<LoginBody>(request, 4096);
  if (error) return error;

  const email = normalizeEmail(body?.email || "");
  const password = body?.password || "";

  if (!email || !password || email.length > 254 || password.length > 256) {
    return jsonError("E-posta veya şifre geçersiz.", 400);
  }

  const clientIp = getClientIp(request);
  const ipLimiter = await rateLimit(`login-ip:${clientIp}`, 20, 15 * 60 * 1000);
  if (!ipLimiter.ok) {
    console.warn("[auth-login-rate-limit]", { scope: "ip", ip: clientIp });
    return jsonError("Çok fazla giriş denemesi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const emailHash = hashValue(email);
  const accountLimiter = await rateLimit(`login-account:${emailHash}`, 8, 15 * 60 * 1000);
  if (!accountLimiter.ok) {
    console.warn("[auth-login-rate-limit]", { scope: "account", emailHash });
    return jsonError("Bu hesap için geçici giriş kilidi uygulandı. Biraz sonra tekrar dene.", 429);
  }

  const authClient = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !data.session) {
    console.warn("[auth-login-failed]", { emailHash, ip: clientIp });
    return jsonError("E-posta veya şifre hatalı.", 401);
  }

  const adminClient = createAdminServerClient(env);
  const isActive = await getUserActiveStatus(adminClient, data.session.user.id);
  if (!isActive) {
    console.warn("[auth-login-passive-user]", { emailHash, ip: clientIp });
    return jsonError("Hesabın geçici olarak pasifleştirildi. Destek ile iletişime geç.", 403);
  }

  return jsonOk({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}
