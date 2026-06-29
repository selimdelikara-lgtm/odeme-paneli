import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { rateLimit } from "../_lib/rate-limit";
import { readJsonBody } from "../_lib/server";

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

const scrubTelemetryText = (value: string, maxLength: number) =>
  value
    .replace(/(eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,})/g, "[jwt]")
    .replace(/(re_[a-zA-Z0-9_-]{20,})/g, "[secret]")
    .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "[email]")
    .slice(0, maxLength);

const shortHash = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 16);

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const limiter = await rateLimit(`telemetry:${clientIp}`, 20, 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Too many telemetry events.", 429);
  }

  const { body, error: bodyError } = await readJsonBody<TelemetryPayload>(request, 8 * 1024);
  if (bodyError) return bodyError;
  if (!body?.message) {
    return jsonError("Invalid telemetry payload.", 400);
  }

  console.error("[client-telemetry]", {
    type: body.type || "unknown",
    message: scrubTelemetryText(body.message, 300),
    path: scrubTelemetryText(body.path || "", 180),
    stackHash: body.stack ? shortHash(body.stack) : null,
    stackLength: body.stack?.length || 0,
  });

  return NextResponse.json({ ok: true });
}
