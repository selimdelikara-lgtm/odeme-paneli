import { requireAdmin } from "../../_lib/admin";
import { jsonError, jsonOk } from "../../_lib/server";

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await context.adminClient
    .from("traffic_events")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return jsonError("Trafik verileri alınamadı.", 500);

  const rows = data || [];
  const countBy = (key: "path" | "referrer" | "device_type" | "browser") =>
    Object.entries(
      rows.reduce<Record<string, number>>((acc, row) => {
        const value = row[key] || "Bilinmiyor";
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

  return jsonOk({
    totals: {
      daily: rows.filter((row) => Date.parse(row.created_at) >= Date.now() - 24 * 60 * 60 * 1000).length,
      weekly: rows.filter((row) => Date.parse(row.created_at) >= Date.now() - 7 * 24 * 60 * 60 * 1000).length,
      monthly: rows.length,
    },
    topPages: countBy("path"),
    referrers: countBy("referrer"),
    devices: countBy("device_type"),
    browsers: countBy("browser"),
    recent: rows.slice(0, 50),
  });
}
