import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_ACCESS_COOKIE, verifyAdminToken } from "../../api/_lib/admin";
import { getServerSupabaseEnv } from "../../api/_lib/server";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const env = getServerSupabaseEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  const context = env && token ? await verifyAdminToken(env, token) : null;

  if (context) redirect("/admin");

  return <AdminLoginForm />;
}
