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
          background: "linear-gradient(135deg, #071326 0%, #0B1F45 54%, #2563EB 100%)",
          color: "#FFFFFF",
          padding: 62,
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -130,
            width: 430,
            height: 430,
            borderRadius: 430,
            background: "rgba(94,234,212,0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 70,
            bottom: -160,
            width: 560,
            height: 560,
            borderRadius: 560,
            background: "rgba(37,99,235,0.30)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 76,
            bottom: 82,
            width: 330,
            height: 190,
            borderRadius: 28,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.24)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: 26,
          }}
        >
          {["Ödeme Alındı", "Fatura Kesildi", "Bekleyen"].map((label, index) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: index === 0 ? "#5EEAD4" : index === 1 ? "#FBBF24" : "#FB7185",
                  boxShadow: "0 0 20px rgba(255,255,255,0.24)",
                }}
              />
              <div style={{ fontSize: 24, fontWeight: 800, color: "#EAF2FF" }}>{label}</div>
            </div>
          ))}
        </div>
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
                width: 68,
                height: 68,
                borderRadius: 22,
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#081F45",
                fontSize: 38,
                fontWeight: 900,
              }}
            >
              Ö
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.8px" }}>
              Ödedimi
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 780 }}>
            <div
              style={{
                fontSize: 70,
                lineHeight: 0.98,
                fontWeight: 900,
                letterSpacing: "-3px",
              }}
            >
              Freelance ödeme takibini tek panelde yönet.
            </div>
            <div style={{ fontSize: 27, lineHeight: 1.35, color: "#D7E4FF", maxWidth: 720 }}>
              Proje, fatura ve tahsilat durumlarını mobil uyumlu panelde düzenli takip et.
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            {["Freelance ödeme takibi", "Fatura takip programı", "Tahsilat paneli"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "12px 16px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: 20,
                  fontWeight: 800,
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
