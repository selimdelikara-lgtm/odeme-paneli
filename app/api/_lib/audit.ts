import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getClientIp, getUserAgent } from "./server";

type WriteAuditLogArgs = {
  adminClient: SupabaseClient<Database>;
  userId: string;
  title: string;
  detail: string;
  source: string;
  request: Request;
};

export const writeAuditLog = async ({
  adminClient,
  userId,
  title,
  detail,
  source,
  request,
}: WriteAuditLogArgs) => {
  const { error } = await adminClient.from("audit_logs").insert({
    user_id: userId,
    title,
    detail,
    source,
    ip: getClientIp(request),
    user_agent: getUserAgent(request),
  });

  return error;
};
