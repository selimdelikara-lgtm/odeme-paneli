import { requireAdmin } from "../../_lib/admin";
import { jsonError, jsonOk, sanitizeSearchTerm } from "../../_lib/server";

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const url = new URL(request.url);
  const query = sanitizeSearchTerm(url.searchParams.get("q") || "");
  const status = url.searchParams.get("status") || "all";
  const project = (url.searchParams.get("project") || "").trim();
  const dateFrom = url.searchParams.get("from");
  const dateTo = url.searchParams.get("to");
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const perPage = Math.min(100, Math.max(10, Number(url.searchParams.get("perPage") || "30")));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let builder = context.adminClient
    .from("odemeler")
    .select("*", { count: "exact" })
    .order("id", { ascending: false })
    .range(from, to);

  if (query) builder = builder.or(`proje.ilike.%${query}%,grup.ilike.%${query}%`);
  if (project) builder = builder.eq("grup", project);
  if (status === "paid") builder = builder.eq("odendi", true);
  if (status === "pending") builder = builder.eq("odendi", false);
  if (status === "invoiced") builder = builder.eq("fatura_kesildi", true);
  if (status === "not_invoiced") builder = builder.eq("fatura_kesildi", false);
  if (dateFrom) builder = builder.gte("fatura_tarihi", dateFrom);
  if (dateTo) builder = builder.lte("fatura_tarihi", dateTo);

  const { data, error, count } = await builder;
  if (error) return jsonError("Ödeme kayıtları alınamadı.", 500);

  const totalsQuery = await context.adminClient
    .from("odemeler")
    .select("tutar, odendi")
    .limit(10000);
  const allRows = totalsQuery.data || [];

  return jsonOk({
    items: data || [],
    page,
    perPage,
    total: count || 0,
    totals: {
      totalAmount: allRows.reduce((sum, row) => sum + Number(row.tutar || 0), 0),
      paidAmount: allRows.filter((row) => row.odendi).reduce((sum, row) => sum + Number(row.tutar || 0), 0),
      pendingAmount: allRows.filter((row) => !row.odendi).reduce((sum, row) => sum + Number(row.tutar || 0), 0),
    },
  });
}
