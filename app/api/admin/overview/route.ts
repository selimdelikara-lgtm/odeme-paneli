import { requireAdmin } from "../../_lib/admin";
import { jsonError, jsonOk } from "../../_lib/server";

const dayMs = 24 * 60 * 60 * 1000;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = new Date(today.getTime() - 6 * dayMs);
  const monthAgo = new Date(today.getTime() - 29 * dayMs);

  const [userResult, paymentResult, trafficToday, trafficWeek, trafficMonth, auditResult] =
    await Promise.all([
      context.adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      context.adminClient
        .from("odemeler")
        .select("id, user_id, proje, grup, tutar, odendi, fatura_kesildi, fatura_tarihi, sira")
        .limit(10000),
      context.adminClient
        .from("traffic_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
      context.adminClient
        .from("traffic_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString()),
      context.adminClient
        .from("traffic_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString()),
      context.adminClient
        .from("admin_audit_logs")
        .select("id, action, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (userResult.error) return jsonError("Kullanıcılar alınamadı.", 500);
  if (paymentResult.error) return jsonError("Ödeme kayıtları alınamadı.", 500);

  const users = userResult.data.users || [];
  const payments = paymentResult.data || [];
  const paidTotal = payments
    .filter((item) => item.odendi)
    .reduce((sum, item) => sum + Number(item.tutar || 0), 0);
  const pendingTotal = payments
    .filter((item) => !item.odendi)
    .reduce((sum, item) => sum + Number(item.tutar || 0), 0);

  const trafficRows = await context.adminClient
    .from("traffic_events")
    .select("created_at")
    .gte("created_at", weekAgo.toISOString())
    .limit(1000);

  const dailyTraffic = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekAgo.getTime() + index * dayMs);
    const key = day.toISOString().slice(0, 10);
    const count = (trafficRows.data || []).filter((row) => row.created_at.slice(0, 10) === key).length;
    return { label: key.slice(5), count };
  });

  const usersByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekAgo.getTime() + index * dayMs);
    const key = day.toISOString().slice(0, 10);
    const count = users.filter((user) => user.created_at?.slice(0, 10) === key).length;
    return { label: key.slice(5), count };
  });

  return jsonOk({
    metrics: {
      totalUsers: users.length,
      visitsToday: trafficToday.count || 0,
      visitsWeek: trafficWeek.count || 0,
      visitsMonth: trafficMonth.count || 0,
      totalPayments: payments.length,
      paidTotal,
      pendingTotal,
      warningCount: auditResult.error ? 1 : 0,
    },
    recentPayments: payments.slice(-8).reverse(),
    recentUsers: users
      .slice()
      .sort((a, b) => String(b.last_sign_in_at || b.created_at).localeCompare(String(a.last_sign_in_at || a.created_at)))
      .slice(0, 8)
      .map((user) => ({
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      })),
    recentAuditLogs: auditResult.data || [],
    charts: {
      dailyTraffic,
      paymentStatus: [
        { label: "Ödendi", count: payments.filter((item) => item.odendi).length },
        { label: "Bekliyor", count: payments.filter((item) => !item.odendi).length },
        { label: "Fatura kesildi", count: payments.filter((item) => item.fatura_kesildi).length },
      ],
      usersByDay,
    },
  });
}
