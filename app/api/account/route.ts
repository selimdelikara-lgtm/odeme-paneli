import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "../_lib/rate-limit";
import type { Database } from "@/lib/database.types";
import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getClientIp,
  getServerSupabaseEnv,
  jsonError,
  jsonOk,
} from "../_lib/server";
import { writeAuditLog } from "../_lib/audit";

const RECENT_REAUTH_WINDOW_MS = 10 * 60 * 1000;

type DeleteBody = {
  currentPassword?: string;
};

export async function DELETE(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const token = getBearerToken(request);
  const clientIp = getClientIp(request);
  const body = (await request.json().catch(() => ({}))) as DeleteBody;
  const currentPassword = body.currentPassword?.trim() || "";

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

  const limiter = await rateLimit(`account-delete:${clientIp}:${user.id}`, 3, 10 * 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla silme denemesi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
  if (!lastSignInAt || Date.now() - lastSignInAt > RECENT_REAUTH_WINDOW_MS) {
    return jsonError("Bu işlem için hesabına kısa süre önce yeniden giriş yapman gerekiyor.", 403);
  }

  const authProviders =
    user.app_metadata && Array.isArray(user.app_metadata.providers)
      ? (user.app_metadata.providers as string[])
      : [];

  if (authProviders.includes("email")) {
    if (!user.email || !currentPassword) {
      return jsonError("Hesabı kapatmak için mevcut şifren gerekli.", 400);
    }

    const verifyClient = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return jsonError("Mevcut şifre doğrulanamadı.", 403);
    }
  }

  const adminClient = createAdminServerClient(env);

  const { data: attachments, error: attachmentsError } = await adminClient
    .from("fatura_ekleri")
    .select("path")
    .eq("user_id", user.id);

  if (attachmentsError) {
    return jsonError("Fatura ekleri alınamadı.", 500);
  }

  const attachmentPaths = ((attachments || []) as Array<{ path: string | null }>)
    .map((item) => item.path || "")
    .filter(Boolean);

  if (attachmentPaths.length) {
    const { error: storageError } = await adminClient.storage
      .from("faturalar")
      .remove(attachmentPaths);

    if (storageError) {
      return jsonError("Dosyalar silinemedi.", 500);
    }
  }

  const { error: attachmentsDeleteError } = await adminClient
    .from("fatura_ekleri")
    .delete()
    .eq("user_id", user.id);

  if (attachmentsDeleteError) {
    return jsonError("Fatura kayıtları silinemedi.", 500);
  }

  const { error: odemelerDeleteError } = await adminClient
    .from("odemeler")
    .delete()
    .eq("user_id", user.id);

  if (odemelerDeleteError) {
    return jsonError("Ödeme kayıtları silinemedi.", 500);
  }

  const { data: avatarFiles } = await adminClient.storage.from("avatars").list(`${user.id}/profile`, {
    limit: 20,
  });

  const avatarPaths = (avatarFiles || [])
    .map((item) => `${user.id}/profile/${item.name}`)
    .filter(Boolean);

  if (avatarPaths.length) {
    const { error: avatarDeleteError } = await adminClient.storage
      .from("avatars")
      .remove(avatarPaths);

    if (avatarDeleteError) {
      return jsonError("Profil fotoğrafı silinemedi.", 500);
    }
  }

  await writeAuditLog({
    adminClient,
    userId: user.id,
    title: "Hesap kapatıldı",
    detail: "Kullanıcı hesabını ve tüm verilerini sildi.",
    source: "account_api",
    request,
  });

  const { error: adminDeleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (adminDeleteError) {
    return jsonError("Auth hesabı silinemedi.", 500);
  }

  return jsonOk({ ok: true });
}
