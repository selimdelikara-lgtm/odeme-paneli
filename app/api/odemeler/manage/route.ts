import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "../../_lib/rate-limit";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type ManageAction = "delete_record" | "delete_tab" | "rename_tab";

type ManagePayload = {
  action?: ManageAction;
  id?: number;
  tabName?: string;
  nextTabName?: string;
};

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

const createAuthedClient = (token: string) =>
  createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

const createAdminClient = () =>
  createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

const deleteAttachmentsForRowIds = async (
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  rowIds: number[]
) => {
  if (!rowIds.length) return null;

  const { data: attachments, error: attachmentsError } = await adminClient
    .from("fatura_ekleri")
    .select("id, path")
    .eq("user_id", userId)
    .in("odeme_id", rowIds);

  if (attachmentsError) {
    return "Fatura ekleri alınamadı.";
  }

  const typedAttachments = ((attachments || []) as Array<{
    id: number | null;
    path: string | null;
  }>).filter((item) => item.path);

  const attachmentPaths = typedAttachments
    .map((item) => item.path || "")
    .filter(Boolean);

  if (attachmentPaths.length) {
    const { error: storageError } = await adminClient.storage
      .from("faturalar")
      .remove(attachmentPaths);

    if (storageError) {
      return "Fatura dosyaları silinemedi.";
    }
  }

  const attachmentIds = typedAttachments
    .map((item) => item.id)
    .filter((item): item is number => typeof item === "number");

  if (attachmentIds.length) {
    const { error: metadataDeleteError } = await adminClient
      .from("fatura_ekleri")
      .delete()
      .eq("user_id", userId)
      .in("id", attachmentIds);

    if (metadataDeleteError) {
      return "Fatura kayıtları silinemedi.";
    }
  }

  return null;
};

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const clientIp = getClientIp(request);

  if (!token) {
    return jsonError("Yetkilendirme bilgisi eksik.", 401);
  }

  const authClient = createAuthedClient(token);
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonError("Kullanıcı doğrulanamadı.", 401);
  }

  const limiter = rateLimit(`manage:${clientIp}:${user.id}`, 20, 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla işlem denemesi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const body = (await request.json().catch(() => null)) as ManagePayload | null;
  const action = body?.action;

  if (!action) {
    return jsonError("Geçersiz işlem isteği.", 400);
  }

  const adminClient = createAdminClient();

  if (action === "delete_record") {
    const id = body?.id;
    if (!Number.isInteger(id)) {
      return jsonError("Geçersiz kayıt id.", 400);
    }

    const attachmentError = await deleteAttachmentsForRowIds(adminClient, user.id, [id as number]);
    if (attachmentError) {
      return jsonError(attachmentError, 500);
    }

    const { error } = await adminClient
      .from("odemeler")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id as number);

    if (error) {
      return jsonError("Kayıt silinemedi.", 500);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "delete_tab") {
    const tabName = body?.tabName?.trim();
    if (!tabName) {
      return jsonError("Sekme adı eksik.", 400);
    }

    const { data: rows, error: rowsError } = await adminClient
      .from("odemeler")
      .select("id")
      .eq("user_id", user.id)
      .eq("grup", tabName);

    if (rowsError) {
      return jsonError("Sekme kayıtları alınamadı.", 500);
    }

    const rowIds = ((rows || []) as Array<{ id: number }>).map((row) => row.id);

    const attachmentError = await deleteAttachmentsForRowIds(adminClient, user.id, rowIds);
    if (attachmentError) {
      return jsonError(attachmentError, 500);
    }

    const { error } = await adminClient
      .from("odemeler")
      .delete()
      .eq("user_id", user.id)
      .eq("grup", tabName);

    if (error) {
      return jsonError("Sekme silinemedi.", 500);
    }

    return NextResponse.json({ ok: true });
  }

  const tabName = body?.tabName?.trim();
  const nextTabName = body?.nextTabName?.trim();

  if (!tabName || !nextTabName) {
    return jsonError("Eski ve yeni sekme adı gerekli.", 400);
  }

  const { error } = await adminClient
    .from("odemeler")
    .update({ grup: nextTabName })
    .eq("user_id", user.id)
    .eq("grup", tabName);

  if (error) {
    return jsonError("Sekme adı güncellenemedi.", 500);
  }

  return NextResponse.json({ ok: true });
}
