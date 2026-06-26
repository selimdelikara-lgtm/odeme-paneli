import type { Json } from "@/lib/database.types";
import { requireAdmin, writeAdminAuditLog } from "../../_lib/admin";
import { jsonError, jsonOk, readJsonBody } from "../../_lib/server";

type SettingsBody = {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  exportFormat?: string;
};

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const { data, error } = await context.adminClient
    .from("system_settings")
    .select("*")
    .in("key", ["maintenance_mode", "export_settings"]);
  if (error) return jsonError("Ayarlar alınamadı.", 500);

  return jsonOk({
    items: data || [],
    admin: {
      email: context.adminUser.email,
      lastLoginAt: context.adminUser.last_login_at,
    },
    system: {
      env: process.env.NODE_ENV || "development",
      supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const { body, error } = await readJsonBody<SettingsBody>(request, 4096);
  if (error) return error;

  const oldSettings = await context.adminClient.from("system_settings").select("*");
  const updates: Array<{ key: string; value: Json; updated_by: string; updated_at: string }> = [];
  const now = new Date().toISOString();

  if (typeof body?.maintenanceMode === "boolean") {
    updates.push({
      key: "maintenance_mode",
      value: {
        enabled: body.maintenanceMode,
        message: typeof body.maintenanceMessage === "string" ? body.maintenanceMessage.slice(0, 300) : "",
      },
      updated_by: context.adminUser.id,
      updated_at: now,
    });
  }

  if (body?.exportFormat === "csv") {
    updates.push({
      key: "export_settings",
      value: { default_format: "csv" },
      updated_by: context.adminUser.id,
      updated_at: now,
    });
  }

  if (!updates.length) return jsonError("Güncellenecek ayar yok.", 400);

  const { error: upsertError } = await context.adminClient.from("system_settings").upsert(updates);
  if (upsertError) return jsonError("Ayarlar güncellenemedi.", 500);

  await writeAdminAuditLog({
    adminClient: context.adminClient,
    adminUserId: context.adminUser.id,
    action: "settings_updated",
    entityType: "settings",
    oldValue: oldSettings.data || null,
    newValue: updates,
    request,
  });

  return jsonOk({ ok: true });
}
