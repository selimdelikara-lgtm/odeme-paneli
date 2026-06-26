import { requireAdmin } from "../../_lib/admin";
import { jsonError, jsonOk } from "../../_lib/server";

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = url.searchParams.get("status") || "all";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const perPage = Math.min(50, Math.max(10, Number(url.searchParams.get("perPage") || "20")));

  const { data, error } = await context.adminClient.auth.admin.listUsers({
    page,
    perPage: query ? 1000 : perPage,
  });
  if (error) return jsonError("Kullanıcı listesi alınamadı.", 500);

  const users = data.users || [];
  const ids = users.map((user) => user.id);
  const { data: statuses } = ids.length
    ? await context.adminClient.from("admin_user_status").select("*").in("user_id", ids)
    : { data: [] };
  const statusByUser = new Map((statuses || []).map((item) => [item.user_id, item]));

  const normalized = users
    .map((user) => {
      const statusRow = statusByUser.get(user.id);
      return {
        id: user.id,
        email: user.email || "",
        name:
          typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : "",
        phone: user.phone || "",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        isActive: statusRow?.is_active ?? true,
        statusNote: statusRow?.note || "",
      };
    })
    .filter((user) => {
      const matchesQuery =
        !query ||
        user.email.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query);
      const matchesStatus =
        status === "all" || (status === "active" ? user.isActive : !user.isActive);
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return jsonOk({
    items: query ? normalized.slice((page - 1) * perPage, page * perPage) : normalized,
    page,
    perPage,
    hasMore: query ? normalized.length > page * perPage : users.length === perPage,
  });
}
