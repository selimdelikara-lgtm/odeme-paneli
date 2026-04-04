import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "../_lib/rate-limit";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

export async function DELETE(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const clientIp = getClientIp(request);

  if (!token) {
    return jsonError("Yetkilendirme bilgisi eksik.", 401);
  }

  const authClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonError("Kullanıcı doğrulanamadı.", 401);
  }

  const limiter = rateLimit(`account-delete:${clientIp}:${user.id}`, 3, 10 * 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla silme denemesi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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

  const { data: avatarFiles } = await adminClient.storage
    .from("avatars")
    .list(`${user.id}/profile`, {
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

  const { error: adminDeleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (adminDeleteError) {
    return jsonError("Auth hesabı silinemedi.", 500);
  }

  return NextResponse.json({ ok: true });
}
