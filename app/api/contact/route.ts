import { hashIp } from "../_lib/admin";
import { rateLimit } from "../_lib/rate-limit";
import {
  createAdminServerClient,
  getClientIp,
  getServerSupabaseEnv,
  getUserAgent,
  jsonError,
  jsonOk,
  readJsonBody,
} from "../_lib/server";

type ContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max = 2000) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (!env) return jsonError("Sunucu ortam değişkenleri eksik.", 500);

  const clientIp = getClientIp(request);
  const limiter = await rateLimit(`contact:${clientIp}`, 5, 10 * 60 * 1000);
  if (!limiter.ok) {
    return jsonError("Çok fazla mesaj gönderildi. Biraz sonra tekrar dene.", 429);
  }

  const { body, error } = await readJsonBody<ContactBody>(request, 8 * 1024);
  if (error) return error;

  if (body?.website) {
    return jsonOk({ ok: true });
  }

  const name = clean(body?.name, 120);
  const email = clean(body?.email, 254).toLowerCase();
  const subject = clean(body?.subject, 160);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";

  if (name.length < 2) return jsonError("Ad soyad alanı zorunlu.", 400);
  if (!emailPattern.test(email)) return jsonError("Geçerli bir e-posta adresi gir.", 400);
  if (subject.length < 2) return jsonError("Konu alanı zorunlu.", 400);
  if (message.length < 10 || message.length > 2000) {
    return jsonError("Mesaj 10 ile 2000 karakter arasında olmalı.", 400);
  }

  const adminClient = createAdminServerClient(env);
  const { error: insertError } = await adminClient.from("contact_messages").insert({
    name,
    email,
    subject,
    message,
    status: "new",
    ip_address: hashIp(clientIp),
    user_agent: getUserAgent(request),
  });

  if (insertError) return jsonError("Mesaj kaydedilemedi. Lütfen tekrar dene.", 500);

  return jsonOk({
    ok: true,
    message: "Mesajınız bize ulaştı. En kısa sürede inceleyeceğiz.",
  });
}
