import { NextResponse, type NextRequest } from "next/server";

const ignoredPrefixes = [
  "/admin",
  "/api",
  "/_next",
  "/maintenance",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/images",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.next();

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    const rows = (await response.json()) as Array<{ value?: { enabled?: boolean } }>;
    if (rows[0]?.value?.enabled) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
