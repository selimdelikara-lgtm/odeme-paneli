import { NextResponse } from "next/server";
import { rateLimit } from "../_lib/rate-limit";

type TelemetryPayload = {
  type?: string;
  message?: string;
  stack?: string;
  path?: string;
};

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const limiter = await rateLimit(`telemetry:${clientIp}`, 20, 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Too many telemetry events.", 429);
  }

  const body = (await request.json().catch(() => null)) as TelemetryPayload | null;
  if (!body?.message) {
    return jsonError("Invalid telemetry payload.", 400);
  }

  console.error("[client-telemetry]", {
    type: body.type || "unknown",
    message: body.message.slice(0, 500),
    path: (body.path || "").slice(0, 255),
    stack: body.stack?.slice(0, 2000) || "",
  });

  return NextResponse.json({ ok: true });
}
