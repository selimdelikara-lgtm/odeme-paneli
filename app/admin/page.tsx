import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_ACCESS_COOKIE, verifyAdminToken } from "../api/_lib/admin";
import { getServerSupabaseEnv } from "../api/_lib/server";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const env = getServerSupabaseEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  const context = env && token ? await verifyAdminToken(env, token) : null;

  if (!context) {
    redirect("/admin/login");
  }

  return <AdminPanel adminEmail={context.adminUser.email} />;
}
