import { rateLimit } from "../../_lib/rate-limit";
import { writeAuditLog } from "../../_lib/audit";
import {
  createAdminServerClient,
  createAuthedServerClient,
  getBearerToken,
  getClientIp,
  getServerSupabaseEnv,
  jsonError,
  jsonOk,
} from "../../_lib/server";

type BulkAction = "invoice" | "paid" | "delete";

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const token = getBearerToken(request);
  const clientIp = getClientIp(request);

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

  const limiter = await rateLimit(`bulk:${clientIp}:${user.id}`, 20, 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla toplu işlem denemesi yapıldı. Biraz sonra tekrar dene.", 429);
  }

  const body = (await request.json().catch(() => null)) as
    | { ids?: number[]; action?: BulkAction }
    | null;

  const ids = Array.isArray(body?.ids) ? body.ids.filter((item) => Number.isInteger(item)) : [];
  const action = body?.action;

  if (!ids.length || !action) {
    return jsonError("Geçersiz toplu işlem isteği.", 400);
  }

  if (ids.length > 250) {
    return jsonError("Tek seferde en fazla 250 kayıt işlenebilir.", 400);
  }

  const adminClient = createAdminServerClient(env);

  if (action === "delete") {
    const { data: attachments, error: attachmentsError } = await adminClient
      .from("fatura_ekleri")
      .select("id, path")
      .eq("user_id", user.id)
      .in("odeme_id", ids);

    if (attachmentsError) {
      return jsonError("Fatura ekleri alınamadı.", 500);
    }

    const typedAttachments = (attachments || []) as Array<{
      id: number | null;
      path: string | null;
    }>;

    const attachmentPaths = typedAttachments
      .map((item) => item.path || "")
      .filter(Boolean);

    if (attachmentPaths.length) {
      const { error: storageError } = await adminClient.storage
        .from("faturalar")
        .remove(attachmentPaths);

      if (storageError) {
        return jsonError("Fatura dosyaları silinemedi.", 500);
      }
    }

    const attachmentIds = typedAttachments
      .map((item) => item.id)
      .filter((item): item is number => typeof item === "number");

    if (attachmentIds.length) {
      const { error: metadataDeleteError } = await adminClient
        .from("fatura_ekleri")
        .delete()
        .eq("user_id", user.id)
        .in("id", attachmentIds);

      if (metadataDeleteError) {
        return jsonError("Fatura kayıtları silinemedi.", 500);
      }
    }

    const { error: deleteError } = await adminClient
      .from("odemeler")
      .delete()
      .eq("user_id", user.id)
      .in("id", ids);

    if (deleteError) {
      return jsonError("Kayıtlar silinemedi.", 500);
    }

    await writeAuditLog({
      adminClient,
      userId: user.id,
      title: "Toplu kayıt silme",
      detail: `${ids.length} kayıt silindi.`,
      source: "bulk_api",
      request,
    });

    return jsonOk({ ok: true });
  }

  const values =
    action === "paid"
      ? { fatura_kesildi: true, odendi: true }
      : { fatura_kesildi: true, odendi: false };

  const { error: updateError } = await adminClient
    .from("odemeler")
    .update(values)
    .eq("user_id", user.id)
    .in("id", ids);

  if (updateError) {
    return jsonError("Toplu işlem uygulanamadı.", 500);
  }

  await writeAuditLog({
    adminClient,
    userId: user.id,
    title: action === "paid" ? "Toplu ödendi güncellemesi" : "Toplu fatura kesildi güncellemesi",
    detail: `${ids.length} kayıt güncellendi.`,
    source: "bulk_api",
    request,
  });

  return jsonOk({ ok: true });
}
