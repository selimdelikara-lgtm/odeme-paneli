"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    void fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "route-error",
        message: error.message,
        stack: error.stack,
        path: typeof window !== "undefined" ? window.location.pathname : "",
      }),
    });
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#F8FAFC",
        color: "#0F172A",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center", display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Bir hata oluştu</h2>
        <p style={{ margin: 0, color: "#64748B" }}>
          Sayfa beklenmedik şekilde durdu. Tekrar denemeyi deneyebilirsin.
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
    </div>
  );
}
