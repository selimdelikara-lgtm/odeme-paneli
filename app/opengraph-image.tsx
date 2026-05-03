import { ImageResponse } from "next/og";

export const alt = "Ödedimi freelance ödeme ve tahsilat takip paneli";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #08162D 0%, #123A8F 58%, #2563EB 100%)",
          color: "#FFFFFF",
          padding: 64,
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -140,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 420,
            background: "rgba(255,255,255,0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 120,
            bottom: -170,
            width: 520,
            height: 520,
            borderRadius: 520,
            background: "rgba(15,118,110,0.22)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#08162D",
                fontSize: 38,
                fontWeight: 900,
              }}
            >
              Ö
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.6px" }}>
              Ödedimi
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 820 }}>
            <div
              style={{
                fontSize: 72,
                lineHeight: 0.98,
                fontWeight: 900,
                letterSpacing: "-3px",
              }}
            >
              Freelance ödemelerini tek panelden takip et.
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.35, color: "#D7E4FF", maxWidth: 760 }}>
              Proje, fatura ve tahsilat durumlarını düzenli yönet. Mobil uyumlu, sade ve hızlı
              ödeme takip paneli.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {["Ödeme Takibi", "Fatura Durumu", "PDF Export"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#F8FAFC",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
