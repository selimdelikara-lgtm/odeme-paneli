"use client";

const particleClassNames = [
  "is-one",
  "is-two",
  "is-three",
  "is-four",
  "is-five",
  "is-six",
];

export function LoginPortalIllustration() {
  return (
    <div className="login-portal" aria-hidden="true">
      <style>{`
        @keyframes portalCoreGlow {
          0%, 100% {
            opacity: .76;
            transform: translate3d(-50%, -50%, 0) scale(.94);
            filter: blur(0);
          }
          42% {
            opacity: 1;
            transform: translate3d(-50%, -50%, 0) scale(1.08);
            filter: blur(.35px);
          }
          64% {
            opacity: .92;
            transform: translate3d(-50%, -50%, 0) scale(1.02);
            filter: blur(.1px);
          }
        }

        @keyframes portalDoorFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) skewY(5deg) rotateY(-24deg) rotateZ(.4deg);
          }
          45% {
            transform: translate3d(0, -8px, 0) skewY(5deg) rotateY(-26deg) rotateZ(-.8deg);
          }
        }

        @keyframes portalBackFloat {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: .92; }
          50% { transform: translate3d(0, -5px, 0); opacity: 1; }
        }

        @keyframes portalParticleFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(.9);
            opacity: .38;
          }
          38% {
            transform: translate3d(8px, -18px, 0) scale(1.08);
            opacity: .95;
          }
          68% {
            transform: translate3d(-6px, -8px, 0) scale(.86);
            opacity: .58;
          }
        }

        @keyframes portalRingFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .34; }
          50% { transform: translate3d(9px, -9px, 0) scale(1.08); opacity: .62; }
        }

        @keyframes portalStepGlow {
          0%, 100% {
            box-shadow: 0 14px 24px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.24);
          }
          50% {
            box-shadow: 0 16px 30px rgba(0,0,0,.36), 0 0 26px rgba(56,189,248,.28), inset 0 1px 0 rgba(255,255,255,.34);
          }
        }

        @keyframes portalChartPulse {
          0%, 100% { opacity: .76; transform: translateY(0) scaleY(.95); }
          48% { opacity: 1; transform: translateY(-1px) scaleY(1.08); }
        }

        .login-portal {
          position: relative;
          min-height: 430px;
          height: 100%;
          display: grid;
          place-items: center;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 50% 48%, rgba(37,99,235,.24), transparent 34%),
            radial-gradient(circle at 52% 78%, rgba(14,165,233,.14), transparent 28%),
            linear-gradient(135deg, rgba(4,9,24,.16), rgba(8,31,69,.22));
        }

        .login-portal::before,
        .login-portal::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          z-index: 0;
        }

        .login-portal::before {
          width: 620px;
          height: 620px;
          left: 50%;
          top: 51%;
          transform: translate3d(-50%, -50%, 0);
          background:
            radial-gradient(circle, rgba(34,211,238,.36) 0 7%, rgba(37,99,235,.28) 18%, rgba(14,165,233,.12) 38%, transparent 66%);
          animation: portalCoreGlow 3.4s ease-in-out infinite;
        }

        .login-portal::after {
          width: 76%;
          height: 18%;
          left: 12%;
          bottom: 9%;
          background: radial-gradient(ellipse, rgba(56,189,248,.34), rgba(37,99,235,.18) 34%, transparent 72%);
          filter: blur(15px);
          animation: portalCoreGlow 4.1s ease-in-out infinite reverse;
        }

        .portal-dot-grid {
          position: absolute;
          width: 160px;
          height: 118px;
          opacity: .36;
          background-image: radial-gradient(circle, rgba(59,130,246,.72) 1.8px, transparent 2px);
          background-size: 18px 18px;
          animation: portalBackFloat 7.2s ease-in-out infinite;
          z-index: 1;
        }

        .portal-dot-grid.is-left { left: 1%; bottom: 31%; }
        .portal-dot-grid.is-right { right: 2%; bottom: 8%; animation-delay: -2.4s; }

        .portal-ring {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(34,211,238,.56);
          box-shadow: 0 0 24px rgba(34,211,238,.18);
          animation: portalRingFloat 6.5s ease-in-out infinite;
          z-index: 1;
        }

        .portal-ring.is-left {
          width: 44px;
          height: 44px;
          left: 22%;
          top: 32%;
        }

        .portal-ring.is-right {
          width: 126px;
          height: 126px;
          right: -5%;
          bottom: 28%;
          border-color: rgba(37,99,235,.22);
          animation-delay: -2s;
        }

        .portal-particle {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: linear-gradient(135deg, #CFFAFE, #5EEAD4 55%, #60A5FA);
          box-shadow: 0 0 18px rgba(34,211,238,.72), 0 0 34px rgba(37,99,235,.38);
          animation: portalParticleFloat 5.2s ease-in-out infinite;
          z-index: 2;
        }

        .portal-particle.is-one { left: 30%; top: 21%; animation-delay: -.6s; }
        .portal-particle.is-two { right: 33%; top: 18%; width: 5px; height: 5px; animation-delay: -1.7s; }
        .portal-particle.is-three { left: 27%; bottom: 35%; width: 9px; height: 9px; animation-delay: -2.5s; }
        .portal-particle.is-four { right: 29%; bottom: 42%; width: 12px; height: 12px; animation-delay: -3.1s; }
        .portal-particle.is-five { right: 38%; bottom: 26%; width: 4px; height: 4px; animation-delay: -4s; }
        .portal-particle.is-six { left: 36%; top: 26%; width: 4px; height: 4px; animation-delay: -4.7s; }

        .portal-scene {
          position: relative;
          width: min(520px, 94%);
          height: 390px;
          z-index: 3;
          perspective: 920px;
        }

        .portal-floor-glow {
          position: absolute;
          left: 21%;
          right: 18%;
          bottom: 44px;
          height: 70px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(56,189,248,.58), rgba(37,99,235,.24) 36%, transparent 74%);
          filter: blur(12px);
          animation: portalCoreGlow 3.8s ease-in-out infinite;
        }

        .portal-platform {
          position: absolute;
          left: 18%;
          right: 15%;
          bottom: 85px;
          height: 42px;
          border-radius: 50%;
          background:
            linear-gradient(180deg, rgba(59,130,246,.82), rgba(6,18,38,.94)),
            radial-gradient(ellipse at 48% 8%, rgba(125,211,252,.72), transparent 54%);
          border: 1px solid rgba(147,197,253,.26);
          box-shadow: 0 28px 54px rgba(0,0,0,.46), inset 0 1px 0 rgba(255,255,255,.16);
          transform: rotateX(58deg);
        }

        .portal-back {
          position: absolute;
          left: 39%;
          top: 18%;
          width: 118px;
          height: 224px;
          border-radius: 24px 12px 12px 12px;
          background: linear-gradient(180deg, #BFFBFF 0%, #67E8F9 38%, #5EEAD4 68%, rgba(34,211,238,.62) 100%);
          border: 2px solid rgba(219,234,254,.88);
          box-shadow:
            0 0 42px rgba(34,211,238,.88),
            0 0 100px rgba(37,99,235,.52),
            inset 0 0 26px rgba(255,255,255,.52);
          animation: portalCoreGlow 3.25s ease-in-out infinite;
        }

        .portal-frame {
          position: absolute;
          left: 37%;
          top: 15.5%;
          width: 138px;
          height: 250px;
          border-radius: 30px 20px 16px 16px;
          border: 2px solid rgba(191,219,254,.88);
          box-shadow: 0 0 34px rgba(96,165,250,.54), inset 0 0 0 1px rgba(255,255,255,.18);
          animation: portalBackFloat 5.8s ease-in-out infinite;
        }

        .portal-door {
          position: absolute;
          left: 53%;
          top: 13.5%;
          width: 120px;
          height: 258px;
          border-radius: 8px 36px 20px 8px;
          background:
            linear-gradient(145deg, rgba(7,16,36,.98) 0%, rgba(8,31,69,.98) 56%, rgba(23,55,126,.98) 100%);
          border: 1px solid rgba(191,219,254,.28);
          box-shadow:
            -20px 0 34px rgba(34,211,238,.30),
            18px 28px 62px rgba(0,0,0,.42),
            inset 1px 0 0 rgba(255,255,255,.14);
          transform-origin: left center;
          animation: portalDoorFloat 4.8s ease-in-out infinite;
          overflow: hidden;
        }

        .portal-door::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 42%;
          background: linear-gradient(90deg, rgba(94,234,212,.18), transparent);
          opacity: .65;
        }

        .portal-mini-chart {
          position: absolute;
          right: 24px;
          top: 83px;
          display: flex;
          align-items: flex-end;
          gap: 6px;
        }

        .portal-mini-chart span {
          width: 9px;
          border-radius: 999px 999px 2px 2px;
          background: linear-gradient(180deg, #5EEAD4, #0EA5E9);
          box-shadow: 0 0 12px rgba(94,234,212,.55);
          transform-origin: bottom;
          animation: portalChartPulse 2.6s ease-in-out infinite;
        }

        .portal-mini-chart span:nth-child(2) { animation-delay: -.45s; }
        .portal-mini-chart span:nth-child(3) { animation-delay: -.9s; }

        .portal-handle {
          position: absolute;
          left: 22px;
          top: 136px;
          width: 34px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, #BFDBFE, #2563EB);
          box-shadow: 0 0 16px rgba(147,197,253,.58);
        }

        .portal-handle::before {
          content: "";
          position: absolute;
          left: -7px;
          top: -3px;
          width: 13px;
          height: 13px;
          border-radius: 999px;
          background: #93C5FD;
          box-shadow: 0 0 14px rgba(147,197,253,.62);
        }

        .portal-step {
          position: absolute;
          height: 24px;
          border-radius: 5px;
          background:
            linear-gradient(180deg, rgba(147,197,253,.98), rgba(37,99,235,.72) 46%, rgba(7,24,58,.96) 100%);
          border: 1px solid rgba(191,219,254,.36);
          transform: skewX(-18deg);
          animation: portalStepGlow 3.4s ease-in-out infinite;
        }

        .portal-step.is-one { width: 146px; left: 39%; bottom: 66px; animation-delay: -.2s; }
        .portal-step.is-two { width: 196px; left: 33%; bottom: 39px; animation-delay: -.55s; }
        .portal-step.is-three { width: 254px; left: 26%; bottom: 10px; animation-delay: -.9s; }

        @media (max-width: 980px) {
          .login-portal {
            min-height: 320px;
          }
          .portal-scene {
            transform: scale(.82);
          }
          .portal-dot-grid,
          .portal-ring.is-right {
            display: none;
          }
        }
      `}</style>

      <div className="portal-dot-grid is-left" />
      <div className="portal-dot-grid is-right" />
      <span className="portal-ring is-left" />
      <span className="portal-ring is-right" />
      {particleClassNames.map((className) => (
        <span key={className} className={`portal-particle ${className}`} />
      ))}

      <div className="portal-scene">
        <div className="portal-floor-glow" />
        <div className="portal-platform" />
        <div className="portal-back" />
        <div className="portal-frame" />
        <div className="portal-door">
          <div className="portal-mini-chart">
            <span style={{ height: 28 }} />
            <span style={{ height: 44 }} />
            <span style={{ height: 62 }} />
          </div>
          <span className="portal-handle" />
        </div>
        <span className="portal-step is-one" />
        <span className="portal-step is-two" />
        <span className="portal-step is-three" />
      </div>
    </div>
  );
}
