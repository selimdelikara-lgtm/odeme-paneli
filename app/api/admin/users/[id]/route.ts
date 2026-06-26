import { requireAdmin, writeAdminAuditLog } from "../../../_lib/admin";
import { jsonError, jsonOk, readJsonBody } from "../../../_lib/server";

type StatusBody = {
  isActive?: boolean;
  note?: string;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const { id } = await params;
  const [userResult, paymentsResult, auditResult, statusResult] = await Promise.all([
    context.adminClient.auth.admin.getUserById(id),
    context.adminClient
      .from("odemeler")
      .select("*")
      .eq("user_id", id)
      .order("id", { ascending: false })
      .limit(100),
    context.adminClient
      .from("audit_logs")
      .select("id, title, detail, source, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(25),
    context.adminClient.from("admin_user_status").select("*").eq("user_id", id).maybeSingle(),
  ]);

  if (userResult.error || !userResult.data.user) {
    return jsonError("Kullanıcı bulunamadı.", 404);
  }
  if (paymentsResult.error) return jsonError("Kullanıcı ödemeleri alınamadı.", 500);

  return jsonOk({
    user: {
      id: userResult.data.user.id,
      email: userResult.data.user.email,
      phone: userResult.data.user.phone,
      createdAt: userResult.data.user.created_at,
      lastSignInAt: userResult.data.user.last_sign_in_at,
      metadata: userResult.data.user.user_metadata,
      isActive: statusResult.data?.is_active ?? true,
      statusNote: statusResult.data?.note || "",
    },
    payments: paymentsResult.data || [],
    activities: auditResult.data || [],
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const { id } = await params;
  const { body, error } = await readJsonBody<StatusBody>(request, 4096);
  if (error) return error;
  if (typeof body?.isActive !== "boolean") {
    return jsonError("Durum bilgisi geçersiz.", 400);
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : null;
  const oldStatus = await context.adminClient
    .from("admin_user_status")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  const { error: upsertError } = await context.adminClient.from("admin_user_status").upsert({
    user_id: id,
    is_active: body.isActive,
    note,
    updated_by: context.adminUser.id,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) return jsonError("Kullanıcı durumu güncellenemedi.", 500);

  await writeAdminAuditLog({
    adminClient: context.adminClient,
    adminUserId: context.adminUser.id,
    action: body.isActive ? "user_activated" : "user_deactivated",
    entityType: "user",
    entityId: id,
    oldValue: oldStatus.data || null,
    newValue: { is_active: body.isActive, note },
    request,
  });

  return jsonOk({ ok: true });
}
