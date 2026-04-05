import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const jsonError = (message: string, status: number) =>
  NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

const getToken = (request: Request) => {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
};

const createAuthedClient = (token: string) =>
  createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

const createAdminClient = () =>
  createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export async function GET(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const token = getToken(request);
  if (!token) {
    return jsonError("Yetkilendirme bilgisi eksik.", 401);
  }

  const authClient = createAuthedClient(token);
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonError("Kullanıcı doğrulanamadı.", 401);
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("audit_logs")
    .select("id, title, detail, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return jsonError("İşlem geçmişi alınamadı.", 500);
  }

  return NextResponse.json(
    {
      items: (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        createdAt: item.created_at,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

type PostBody = {
  title?: string;
  detail?: string;
  source?: string;
};

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonError("Sunucu ortam değişkenleri eksik.", 500);
  }

  const token = getToken(request);
  if (!token) {
    return jsonError("Yetkilendirme bilgisi eksik.", 401);
  }

  const authClient = createAuthedClient(token);
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonError("Kullanıcı doğrulanamadı.", 401);
  }

  const body = (await request.json().catch(() => null)) as PostBody | null;
  const title = body?.title?.trim() || "";
  const detail = body?.detail?.trim() || "";
  const source = body?.source?.trim() || "client";

  if (!title || !detail) {
    return jsonError("Eksik audit log verisi.", 400);
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("audit_logs").insert({
    user_id: user.id,
    title: title.slice(0, 120),
    detail: detail.slice(0, 400),
    source: source.slice(0, 32),
    ip: getClientIp(request),
    user_agent: request.headers.get("user-agent")?.slice(0, 255) || null,
  });

  if (error) {
    return jsonError("İşlem geçmişi yazılamadı.", 500);
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
