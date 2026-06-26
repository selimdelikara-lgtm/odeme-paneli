import type { Database } from "@/lib/database.types";
import { requireAdmin, writeAdminAuditLog } from "../../../_lib/admin";
import { jsonError, jsonOk, readJsonBody } from "../../../_lib/server";

type ContactStatus = Database["public"]["Tables"]["contact_messages"]["Row"]["status"];
type MessageBody = {
  status?: ContactStatus;
  adminNote?: string | null;
  viewed?: boolean;
};

const statuses = new Set(["new", "reviewed", "resolved", "archived"]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const { id } = await params;
  const { data, error } = await context.adminClient
    .from("contact_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return jsonError("Mesaj bulunamadı.", 404);

  const { data: replies } = await context.adminClient
    .from("contact_message_replies")
    .select("*")
    .eq("contact_message_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  await writeAdminAuditLog({
    adminClient: context.adminClient,
    adminUserId: context.adminUser.id,
    action: "contact_message_viewed",
    entityType: "contact_message",
    entityId: id,
    newValue: { subject: data.subject, email: data.email },
    request,
  });

  return jsonOk({ item: data, replies: replies || [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const { id } = await params;
  const { body, error } = await readJsonBody<MessageBody>(request, 8 * 1024);
  if (error) return error;

  const oldResult = await context.adminClient
    .from("contact_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (oldResult.error || !oldResult.data) return jsonError("Mesaj bulunamadı.", 404);

  const update: Database["public"]["Tables"]["contact_messages"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (body?.status) {
    if (!statuses.has(body.status)) return jsonError("Mesaj durumu geçersiz.", 400);
    update.status = body.status;
  }

  if (Object.prototype.hasOwnProperty.call(body || {}, "adminNote")) {
    update.admin_note =
      typeof body?.adminNote === "string" ? body.adminNote.trim().slice(0, 1000) : null;
  }

  if (!update.status && !Object.prototype.hasOwnProperty.call(update, "admin_note")) {
    return jsonError("Güncellenecek alan yok.", 400);
  }

  const { data, error: updateError } = await context.adminClient
    .from("contact_messages")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) return jsonError("Mesaj güncellenemedi.", 500);

  const statusChanged = oldResult.data.status !== data.status;
  const noteChanged = (oldResult.data.admin_note || "") !== (data.admin_note || "");
  await writeAdminAuditLog({
    adminClient: context.adminClient,
    adminUserId: context.adminUser.id,
    action:
      data.status === "archived" && statusChanged
        ? "contact_message_archived"
        : statusChanged
          ? "contact_message_status_updated"
          : noteChanged
            ? "contact_message_note_updated"
            : "contact_message_updated",
    entityType: "contact_message",
    entityId: id,
    oldValue: { status: oldResult.data.status, admin_note: oldResult.data.admin_note },
    newValue: { status: data.status, admin_note: data.admin_note },
    request,
  });

  return jsonOk({ item: data });
}
