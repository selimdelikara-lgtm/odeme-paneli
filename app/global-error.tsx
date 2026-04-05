"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    void fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "global-error",
        message: error.message,
        stack: error.stack,
        path: typeof window !== "undefined" ? window.location.pathname : "",
      }),
    });
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#0F172A",
          color: "#fff",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Kritik bir hata oluştu</h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,.72)" }}>
            Sayfa yeniden yüklenerek düzelebilir.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "none",
              borderRadius: 14,
              padding: "12px 16px",
              background: "#2563EB",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
