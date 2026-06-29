import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import {
  createAdminServerClient,
  getClientIp,
  getServerSupabaseEnv,
  getUserAgent,
  isSameOriginRequest,
  type ServerSupabaseEnv,
} from "./server";

export const ADMIN_ACCESS_COOKIE = "odedimi_admin_access";
export const ADMIN_REFRESH_COOKIE = "odedimi_admin_refresh";

export type AdminContext = {
  env: ServerSupabaseEnv;
  adminClient: SupabaseClient<Database>;
  adminUser: Database["public"]["Tables"]["admin_user"]["Row"];
};

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8,
};

export const hashIp = (ip: string) => {
  const salt = process.env.TRAFFIC_IP_HASH_SALT || process.env.ADMIN_COOKIE_SECRET || "odedimi-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
};

const base64UrlEncode = (value: string) => Buffer.from(value).toString("base64url");
const base64UrlDecode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const MIN_ADMIN_COOKIE_SECRET_LENGTH = 32;
const DEV_ADMIN_COOKIE_SECRET = "odedimi-local-admin-cookie-secret";

export const hasSecureAdminCookieSecret = () => {
  const secret = process.env.ADMIN_COOKIE_SECRET || "";
  if (process.env.NODE_ENV !== "production") return true;
  return secret.length >= MIN_ADMIN_COOKIE_SECRET_LENGTH && secret !== DEV_ADMIN_COOKIE_SECRET;
};

const getAdminCookieSecret = () => {
  if (!hasSecureAdminCookieSecret()) {
    throw new Error("ADMIN_COOKIE_SECRET is missing or too short for production.");
  }
  return process.env.ADMIN_COOKIE_SECRET || DEV_ADMIN_COOKIE_SECRET;
};

const signValue = (value: string) =>
  createHmac("sha256", getAdminCookieSecret()).update(value).digest("base64url");

export const createAdminSessionToken = (adminUserId: string) => {
  const payload = base64UrlEncode(
    JSON.stringify({
      adminUserId,
      exp: Date.now() + adminCookieOptions.maxAge * 1000,
    })
  );
  return `${payload}.${signValue(payload)}`;
};

const verifyAdminSessionToken = (token: string): { adminUserId: string } | null => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let expected = "";
  try {
    expected = signValue(payload);
  } catch {
    return null;
  }
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as {
      adminUserId?: string;
      exp?: number;
    };
    if (!decoded.adminUserId || !decoded.exp || decoded.exp < Date.now()) return null;
    return { adminUserId: decoded.adminUserId };
  } catch {
    return null;
  }
};

export const getCookieValue = (request: Request, name: string) => {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
};

export const verifyAdminToken = async (
  env: ServerSupabaseEnv,
  token: string
): Promise<AdminContext | null> => {
  const session = verifyAdminSessionToken(token);
  if (!session) return null;
  const adminClient = createAdminServerClient(env);
  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_user")
    .select("*")
    .eq("id", session.adminUserId)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !adminUser) return null;

  return {
    env,
    adminClient,
    adminUser,
  };
};

export const requireAdmin = async (request: Request): Promise<AdminContext | null> => {
  const env = getServerSupabaseEnv();
  if (!env) return null;
  if (!hasSecureAdminCookieSecret()) return null;

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    if (!isSameOriginRequest(request)) return null;
  }

  const token = getCookieValue(request, ADMIN_ACCESS_COOKIE);
  if (!token) return null;

  return verifyAdminToken(env, decodeURIComponent(token));
};

export const writeAdminAuditLog = async ({
  adminClient,
  adminUserId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  request,
}: {
  adminClient: SupabaseClient<Database>;
  adminUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  oldValue?: Json | null;
  newValue?: Json | null;
  request: Request;
}) =>
  adminClient.from("admin_audit_logs").insert({
    action,
    entity_type: entityType,
    entity_id: entityId == null ? null : String(entityId),
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    admin_user_id: adminUserId ?? null,
    ip_address: hashIp(getClientIp(request)),
    user_agent: getUserAgent(request),
  });
