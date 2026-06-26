"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    setError("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      setError(payload.error || "Mesaj gönderilemedi. Lütfen tekrar dene.");
      setLoading(false);
      return;
    }

    setNotice(payload.message || "Mesajınız bize ulaştı. En kısa sürede inceleyeceğiz.");
    setForm(initialForm);
    setLoading(false);
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <input
        className="contact-honeypot"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(event) => setForm({ ...form, website: event.target.value })}
        aria-hidden="true"
      />
      <label>
        Ad Soyad
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          maxLength={120}
        />
      </label>
      <label>
        E-posta
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
          maxLength={254}
        />
      </label>
      <label>
        Konu
        <input
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
          required
          maxLength={160}
        />
      </label>
      <label>
        Mesaj
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          required
          minLength={10}
          maxLength={2000}
          rows={7}
        />
      </label>
      <div className="contact-counter">{form.message.length}/2000</div>
      {notice ? <p className="contact-success">{notice}</p> : null}
      {error ? <p className="contact-error">{error}</p> : null}
      <button type="submit" disabled={loading}>
        {loading ? "Gönderiliyor..." : "Mesaj gönder"}
        <Send size={17} />
      </button>
    </form>
  );
}
