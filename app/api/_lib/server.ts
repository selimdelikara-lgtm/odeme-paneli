import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export type ServerSupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};

export const getServerSupabaseEnv = (): ServerSupabaseEnv | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
};

export const jsonError = (message: string, status: number) =>
  NextResponse.json(
    { error: message },
    {
      status,
      headers: NO_STORE_HEADERS,
    }
  );

export const jsonOk = <T extends object>(payload: T, status = 200) =>
  NextResponse.json(payload, {
    status,
    headers: NO_STORE_HEADERS,
  });

export const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

export const getUserAgent = (request: Request) =>
  request.headers.get("user-agent")?.slice(0, 255) || null;

export const getBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
};

export const createAuthedServerClient = (
  env: ServerSupabaseEnv,
  token: string
): SupabaseClient<Database> =>
  createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

export const createAdminServerClient = (
  env: ServerSupabaseEnv
): SupabaseClient<Database> =>
  createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
