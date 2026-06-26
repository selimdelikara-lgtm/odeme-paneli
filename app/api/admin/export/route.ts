import { requireAdmin, writeAdminAuditLog } from "../../_lib/admin";
import { jsonError } from "../../_lib/server";

const csvCell = (value: unknown) => {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "payments";
  const status = url.searchParams.get("status") || "all";
  const dateFrom = url.searchParams.get("from");
  const dateTo = url.searchParams.get("to");

  if (type === "users") {
    const { data, error } = await context.adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return jsonError("Kullanıcı export alınamadı.", 500);

    const rows = [
      ["id", "email", "phone", "created_at", "last_sign_in_at"],
      ...(data.users || []).map((user) => [
        user.id,
        user.email || "",
        user.phone || "",
        user.created_at || "",
        user.last_sign_in_at || "",
      ]),
    ];

    await writeAdminAuditLog({
      adminClient: context.adminClient,
      adminUserId: context.adminUser.id,
      action: "users_exported",
      entityType: "export",
      newValue: { type },
      request,
    });

    return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="odedimi-users-${Date.now()}.csv"`,
      },
    });
  }

  let builder = context.adminClient
    .from("odemeler")
    .select("id, user_id, proje, grup, tutar, odendi, fatura_kesildi, fatura_tarihi, kdvli, gvkli, sira")
    .order("id", { ascending: false })
    .limit(10000);
  if (status === "paid") builder = builder.eq("odendi", true);
  if (status === "pending") builder = builder.eq("odendi", false);
  if (dateFrom) builder = builder.gte("fatura_tarihi", dateFrom);
  if (dateTo) builder = builder.lte("fatura_tarihi", dateTo);

  const { data, error } = await builder;
  if (error) return jsonError("Ödeme export alınamadı.", 500);

  const rows = [
    ["id", "user_id", "proje", "grup", "tutar", "odendi", "fatura_kesildi", "fatura_tarihi", "kdvli", "gvkli", "sira"],
    ...(data || []).map((row) => [
      row.id,
      row.user_id,
      row.proje || "",
      row.grup || "",
      row.tutar ?? "",
      row.odendi ? "evet" : "hayir",
      row.fatura_kesildi ? "evet" : "hayir",
      row.fatura_tarihi || "",
      row.kdvli ? "evet" : "hayir",
      row.gvkli ? "evet" : "hayir",
      row.sira ?? "",
    ]),
  ];

  await writeAdminAuditLog({
    adminClient: context.adminClient,
    adminUserId: context.adminUser.id,
    action: "payments_exported",
    entityType: "export",
    newValue: { type, status, dateFrom, dateTo, count: data?.length || 0 },
    request,
  });

  return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="odedimi-payments-${Date.now()}.csv"`,
    },
  });
}
