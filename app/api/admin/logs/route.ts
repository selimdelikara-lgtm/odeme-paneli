import { requireAdmin } from "../../_lib/admin";
import { jsonError, jsonOk, sanitizeSearchTerm } from "../../_lib/server";

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const url = new URL(request.url);
  const q = sanitizeSearchTerm(url.searchParams.get("q") || "");
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const perPage = Math.min(100, Math.max(20, Number(url.searchParams.get("perPage") || "50")));
  const from = (page - 1) * perPage;

  let builder = context.adminClient
    .from("admin_audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);
  if (q) builder = builder.or(`action.ilike.%${q}%,entity_type.ilike.%${q}%,entity_id.ilike.%${q}%`);

  const { data, error, count } = await builder;
  if (error) return jsonError("Loglar alınamadı.", 500);
  return jsonOk({ items: data || [], total: count || 0, page, perPage });
}
