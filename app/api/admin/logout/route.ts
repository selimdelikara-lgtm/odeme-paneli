import { NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  adminCookieOptions,
  requireAdmin,
  writeAdminAuditLog,
} from "../../_lib/admin";

export async function POST(request: Request) {
  const context = await requireAdmin(request);
  if (context) {
    await writeAdminAuditLog({
      adminClient: context.adminClient,
      adminUserId: context.adminUser.id,
      action: "admin_logout",
      entityType: "admin_auth",
      entityId: context.adminUser.id,
      request,
    });
  }

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_ACCESS_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  response.cookies.set(ADMIN_REFRESH_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
}
