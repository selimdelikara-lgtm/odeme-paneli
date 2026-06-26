import type { Json, OdemeUpdate } from "@/lib/database.types";
import { requireAdmin, writeAdminAuditLog } from "../../../_lib/admin";
import { jsonError, jsonOk, readJsonBody } from "../../../_lib/server";

type PaymentBody = {
  proje?: string | null;
  grup?: string | null;
  tutar?: number | null;
  fatura_tarihi?: string | null;
  fatura_kesildi?: boolean;
  odendi?: boolean;
  kdvli?: boolean;
  gvkli?: boolean;
};

const allowedKeys = [
  "proje",
  "grup",
  "tutar",
  "fatura_tarihi",
  "fatura_kesildi",
  "odendi",
  "kdvli",
  "gvkli",
] as const;

const buildChanges = (
  oldRow: Record<string, unknown>,
  newRow: Record<string, unknown>
) =>
  allowedKeys
    .map((key) => ({
      field: key,
      old: (oldRow[key] ?? null) as Json,
      next: (newRow[key] ?? null) as Json,
    }))
    .filter((item) => JSON.stringify(item.old) !== JSON.stringify(item.next));

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const { id } = await params;
  const paymentId = Number(id);
  if (!Number.isInteger(paymentId)) return jsonError("Geçersiz ödeme id.", 400);

  const { body, error } = await readJsonBody<PaymentBody>(request, 12 * 1024);
  if (error) return error;
  if (!body || typeof body !== "object") return jsonError("Güncellenecek alan bulunamadı.", 400);

  const update: OdemeUpdate = {};
  for (const key of allowedKeys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = body[key];
    if ((key === "proje" || key === "grup") && value !== null) {
      if (typeof value !== "string" || value.trim().length < 1 || value.trim().length > 160) {
        return jsonError("Metin alanı geçersiz.", 400);
      }
      update[key] = value.trim();
      continue;
    }
    if (key === "tutar") {
      if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
        return jsonError("Tutar geçersiz.", 400);
      }
      update.tutar = value;
      continue;
    }
    if (key === "fatura_tarihi") {
      if (value !== null && typeof value !== "string") return jsonError("Tarih geçersiz.", 400);
      update.fatura_tarihi = value || null;
      continue;
    }
    if (typeof value !== "boolean") return jsonError("Durum alanı geçersiz.", 400);
    if (key === "fatura_kesildi") update.fatura_kesildi = value;
    if (key === "odendi") update.odendi = value;
    if (key === "kdvli") update.kdvli = value;
    if (key === "gvkli") update.gvkli = value;
  }

  if (!Object.keys(update).length) return jsonError("Güncellenecek alan bulunamadı.", 400);

  const oldResult = await context.adminClient
    .from("odemeler")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (oldResult.error || !oldResult.data) return jsonError("Ödeme kaydı bulunamadı.", 404);

  const { data, error: updateError } = await context.adminClient
    .from("odemeler")
    .update(update)
    .eq("id", paymentId)
    .select("*")
    .single();

  if (updateError) return jsonError("Ödeme kaydı güncellenemedi.", 500);

  const changes = buildChanges(oldResult.data, data);

  await writeAdminAuditLog({
    adminClient: context.adminClient,
    adminUserId: context.adminUser.id,
    action: "payment_updated",
    entityType: "payment",
    entityId: paymentId,
    oldValue: { id: paymentId, proje: oldResult.data.proje, changes },
    newValue: { id: paymentId, proje: data.proje, changes },
    request,
  });

  return jsonOk({ item: data });
}
