"use client";

import { useEffect, useMemo, useState } from "react";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  target: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Hos Geldin",
    description: "Burasi odemelerini, projelerini ve finans takibini yonettigin ana panel.",
    target: "[data-onboarding-target='welcome']",
  },
  {
    id: "projects",
    title: "Projeler",
    description: "Yeni islerini buradan ekleyebilir, proje durumlarini takip edebilirsin.",
    target: "[data-onboarding-target='projects']",
  },
  {
    id: "payments",
    title: "Odemeler",
    description: "Bekleyen, gelen veya geciken odemelerini buradan kontrol edebilirsin.",
    target: "[data-onboarding-target='payments']",
  },
  {
    id: "due",
    title: "Vade Takibi",
    description: "Odemelerin kac gun sonra gelecegini ve gecikme durumunu buradan gorebilirsin.",
    target: "[data-onboarding-target='due']",
  },
  {
    id: "reports",
    title: "Raporlar",
    description: "Gelir, gider ve genel durum ozetlerini buradan inceleyebilirsin.",
    target: "[data-onboarding-target='reports']",
  },
  {
    id: "settings",
    title: "Ayarlar",
    description: "Hesap, bildirim ve panel tercihlerini buradan duzenleyebilirsin.",
    target: "[data-onboarding-target='settings']",
  },
];

type RectState = {
  top: number;
  left: number;
  width: number;
  height: number;
  found: boolean;
};

type OnboardingTourProps = {
  open: boolean;
  onSkip: () => void;
  onComplete: () => void;
};

const fallbackRect = (): RectState => ({
  top: Math.max(96, window.innerHeight * 0.28),
  left: Math.max(24, window.innerWidth * 0.5 - 160),
  width: Math.min(320, window.innerWidth - 48),
  height: 88,
  found: false,
});

export function OnboardingTour({ open, onSkip, onComplete }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<RectState | null>(null);

  const step = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  useEffect(() => {
    if (!open || !step) return;

    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(step.target);

      if (!target) {
        setRect(fallbackRect());
        return;
      }

      target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });

      window.setTimeout(() => {
        const box = target.getBoundingClientRect();
        setRect({
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          found: true,
        });
      }, 180);
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, step]);

  const popoverStyle = useMemo(() => {
    if (!rect) return {};

    const maxWidth = Math.min(360, window.innerWidth - 32);
    const preferTop = rect.top + rect.height + 18;
    const belowFits = preferTop + 260 < window.innerHeight;
    const top = belowFits ? preferTop : Math.max(18, rect.top - 250);
    const rawLeft = rect.left + rect.width / 2 - maxWidth / 2;
    const left = Math.min(Math.max(16, rawLeft), window.innerWidth - maxWidth - 16);

    return {
      top,
      left,
      width: maxWidth,
    };
  }, [rect]);

  if (!open || !step || !rect) return null;

  const highlightPad = rect.found ? 8 : 0;

  return (
    <div
      aria-live="polite"
      role="dialog"
      aria-modal="true"
      aria-label="Yardim turu"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.42)",
          backdropFilter: "blur(2px)",
        }}
      />

      {rect.found ? (
        <div
          style={{
            position: "fixed",
            top: Math.max(8, rect.top - highlightPad),
            left: Math.max(8, rect.left - highlightPad),
            width: rect.width + highlightPad * 2,
            height: rect.height + highlightPad * 2,
            borderRadius: 18,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.10), 0 0 0 3px rgba(37, 99, 235, 0.55)",
            border: "1px solid rgba(255,255,255,0.7)",
            pointerEvents: "none",
          }}
        />
      ) : null}

      <div
        style={{
          position: "fixed",
          ...popoverStyle,
          background: "color-mix(in srgb, var(--amberSoft) 74%, var(--card) 26%)",
          color: "var(--text)",
          border: "1px solid color-mix(in srgb, var(--amber) 26%, var(--border) 74%)",
          borderRadius: 16,
          boxShadow: "0 26px 80px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.38) inset",
          padding: 18,
          opacity: 0.96,
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
              {stepIndex + 1} / {ONBOARDING_STEPS.length}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.2 }}>{step.title}</h2>
          </div>
          <button
            type="button"
            onClick={onSkip}
            style={{
              border: "0",
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
              fontWeight: 800,
              padding: 0,
            }}
          >
            Atla
          </button>
        </div>

        <p style={{ margin: "12px 0 18px", color: "var(--textSoft)", lineHeight: 1.55 }}>
          {step.description}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            style={{
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: stepIndex === 0 ? "var(--muted)" : "var(--text)",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 800,
              opacity: stepIndex === 0 ? 0.5 : 1,
              cursor: stepIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            Geri
          </button>

          <button
            type="button"
            onClick={() => {
              if (isLastStep) {
                onComplete();
                return;
              }
              setStepIndex((current) => Math.min(ONBOARDING_STEPS.length - 1, current + 1));
            }}
            style={{
              border: "1px solid var(--blue)",
              background: "var(--blue)",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 16px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {isLastStep ? "Tamamla" : "Sonraki"}
          </button>
        </div>
      </div>
    </div>
  );
}
