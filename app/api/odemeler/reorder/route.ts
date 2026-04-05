import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "../../_lib/rate-limit";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

type ReorderPayload = {
  ids?: number[];
};

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
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

  const clientIp = getClientIp(request);
  const limiter = await rateLimit(`reorder:${clientIp}:${user.id}`, 30, 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla sıralama işlemi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const body = (await request.json().catch(() => null)) as ReorderPayload | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((item) => Number.isInteger(item)) : [];

  if (!ids.length || ids.length > 250) {
    return jsonError("Geçersiz sıralama isteği.", 400);
  }

  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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

  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    title: "Kayıt sırası değiştirildi",
    detail: `${ids.length} kayıt yeniden sıralandı.`,
    source: "reorder_api",
    ip: clientIp,
    user_agent: request.headers.get("user-agent")?.slice(0, 255) || null,
  });

  return NextResponse.json({ ok: true });
}
