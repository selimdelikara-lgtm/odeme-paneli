import { requireAdmin } from "../../_lib/admin";
import { jsonError, jsonOk, sanitizeSearchTerm } from "../../_lib/server";

const statuses = new Set(["new", "reviewed", "resolved", "archived"]);

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const url = new URL(request.url);
  const q = sanitizeSearchTerm(url.searchParams.get("q") || "");
  const status = url.searchParams.get("status") || "all";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const perPage = Math.min(50, Math.max(10, Number(url.searchParams.get("perPage") || "20")));
  const from = (page - 1) * perPage;

  let builder = context.adminClient
    .from("contact_messages")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (statuses.has(status)) {
    builder = builder.eq("status", status as "new" | "reviewed" | "resolved" | "archived");
  }
  if (q) builder = builder.or(`name.ilike.%${q}%,email.ilike.%${q}%,subject.ilike.%${q}%,message.ilike.%${q}%`);

  const { data, error, count } = await builder;
  if (error) return jsonError("Mesajlar alınamadı.", 500);

  return jsonOk({ items: data || [], total: count || 0, page, perPage });
}
