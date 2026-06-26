import { rateLimit } from "../_lib/rate-limit";
import { hashIp } from "../_lib/admin";
import {
  createAdminServerClient,
  getClientIp,
  getServerSupabaseEnv,
  getUserAgent,
  jsonError,
  jsonOk,
  readJsonBody,
} from "../_lib/server";

type TrafficBody = {
  path?: string;
  referrer?: string;
  deviceType?: string;
  browser?: string;
};

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonOk({ ok: true });

  const clientIp = getClientIp(request);
  const limiter = await rateLimit(`traffic-event:${clientIp}`, 60, 60 * 1000);
  if (!limiter.ok) return jsonError("Too many traffic events.", 429);

  const { body, error } = await readJsonBody<TrafficBody>(request, 4096);
  if (error) return error;

  const path = typeof body?.path === "string" ? body.path.slice(0, 300) : "";
  if (!path || path.startsWith("/admin")) return jsonOk({ ok: true });

  const adminClient = createAdminServerClient(env);
  await adminClient.from("traffic_events").insert({
    path,
    referrer: typeof body?.referrer === "string" ? body.referrer.slice(0, 300) : null,
    device_type: typeof body?.deviceType === "string" ? body.deviceType.slice(0, 40) : null,
    browser: typeof body?.browser === "string" ? body.browser.slice(0, 80) : null,
    ip_hash: hashIp(clientIp),
    user_agent: getUserAgent(request),
  });

  return jsonOk({ ok: true });
}
