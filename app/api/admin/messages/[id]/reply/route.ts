import { requireAdmin, writeAdminAuditLog } from "../../../../_lib/admin";
import { jsonError, jsonOk, readJsonBody } from "../../../../_lib/server";

type ReplyBody = {
  message?: string;
};

type ResendResponse = {
  id?: string;
  name?: string;
  message?: string;
  error?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toParagraphs = (value: string) =>
  escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br />")}</p>`)
    .join("");

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdmin(request);
  if (!context) return jsonError("Admin yetkisi gerekli.", 401);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const replyTo = process.env.ADMIN_REPLY_TO_EMAIL || process.env.ADMIN_PANEL_EMAIL || from;

  if (!apiKey || !from) {
    return jsonError("E-posta gönderimi için RESEND_API_KEY ve RESEND_FROM_EMAIL gerekli.", 500);
  }

  const { id } = await params;
  const { body, error } = await readJsonBody<ReplyBody>(request, 12 * 1024);
  if (error) return error;

  const replyMessage = typeof body?.message === "string" ? body.message.trim() : "";
  if (replyMessage.length < 2) return jsonError("Cevap metni çok kısa.", 400);
  if (replyMessage.length > 5000) return jsonError("Cevap metni en fazla 5000 karakter olabilir.", 400);

  const { data: contactMessage, error: messageError } = await context.adminClient
    .from("contact_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (messageError || !contactMessage) return jsonError("Mesaj bulunamadı.", 404);

  const subject = `Re: ${contactMessage.subject}`;
  const originalText = [
    "----- Gelen mesaj -----",
    `Gönderen: ${contactMessage.name} <${contactMessage.email}>`,
    `Konu: ${contactMessage.subject}`,
    "",
    contactMessage.message,
  ].join("\n");
  const text = `${replyMessage}\n\n${originalText}`;
  const html = [
    toParagraphs(replyMessage),
    "<hr />",
    "<p><strong>Gelen mesaj</strong></p>",
    `<p><strong>Gönderen:</strong> ${escapeHtml(contactMessage.name)} &lt;${escapeHtml(contactMessage.email)}&gt;</p>`,
    `<p><strong>Konu:</strong> ${escapeHtml(contactMessage.subject)}</p>`,
    toParagraphs(contactMessage.message),
  ].join("");

  let resendResponse: Response;
  let resendPayload: ResendResponse = {};
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [contactMessage.email],
        reply_to: replyTo,
        subject,
        text,
        html,
      }),
    });
    resendPayload = (await resendResponse.json().catch(() => ({}))) as ResendResponse;
  } catch (error) {
    await writeAdminAuditLog({
      adminClient: context.adminClient,
      adminUserId: context.adminUser.id,
      action: "contact_message_reply_failed",
      entityType: "contact_message",
      entityId: id,
      newValue: {
        email: contactMessage.email,
        subject,
        provider_error: error instanceof Error ? error.message : "network_error",
      },
      request,
    });
    return jsonError("E-posta servisine ulaşılamadı. Biraz sonra tekrar deneyin.", 502);
  }

  if (!resendResponse.ok) {
    await writeAdminAuditLog({
      adminClient: context.adminClient,
      adminUserId: context.adminUser.id,
      action: "contact_message_reply_failed",
      entityType: "contact_message",
      entityId: id,
      newValue: {
        email: contactMessage.email,
        subject,
        provider_error: resendPayload.message || resendPayload.error || resendPayload.name || "unknown",
      },
      request,
    });
    return jsonError("E-posta gönderilemedi. Resend ayarlarını kontrol edin.", 502);
  }

  const providerId = resendPayload.id || null;
  await context.adminClient.from("contact_message_replies").insert({
    contact_message_id: id,
    admin_user_id: context.adminUser.id,
    email: contactMessage.email,
    subject,
    message: replyMessage,
    provider: "resend",
    provider_id: providerId,
  });

  if (contactMessage.status === "new") {
    await context.adminClient
      .from("contact_messages")
      .update({ status: "reviewed", updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  await writeAdminAuditLog({
    adminClient: context.adminClient,
    adminUserId: context.adminUser.id,
    action: "contact_message_replied",
    entityType: "contact_message",
    entityId: id,
    newValue: {
      email: contactMessage.email,
      subject,
      provider: "resend",
      provider_id: providerId,
    },
    request,
  });

  return jsonOk({ ok: true, id: providerId });
}
