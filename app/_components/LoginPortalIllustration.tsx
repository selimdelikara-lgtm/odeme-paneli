"use client";

export function LoginPortalIllustration() {
  return (
    <div className="login-portal" aria-hidden="true">
      <style>{`
        @keyframes portalGlow {
          0%, 100% {
            opacity: .76;
            transform: translate3d(-50%, -50%, 0) scale(.98);
          }
          50% {
            opacity: 1;
            transform: translate3d(-50%, -50%, 0) scale(1.04);
          }
        }

        @keyframes portalFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes portalDoorFloat {
          0%, 100% {
            transform: translateY(0) skewY(2deg) rotateY(-22deg);
          }
          50% {
            transform: translateY(-3px) skewY(2deg) rotateY(-22deg);
          }
        }

        @keyframes portalChartGlow {
          0%, 100% { opacity: .84; }
          50% { opacity: 1; }
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
            radial-gradient(circle at 45% 48%, rgba(30,64,175,.42), transparent 30%),
            radial-gradient(circle at 47% 72%, rgba(14,165,233,.16), transparent 24%),
            linear-gradient(135deg, rgba(3,22,34,.24), rgba(12,35,76,.24));
        }

        .login-portal::before {
          content: "";
          position: absolute;
          left: 47%;
          top: 48%;
          width: 560px;
          height: 500px;
          border-radius: 999px;
          background:
            radial-gradient(circle, rgba(34,211,238,.32) 0 13%, rgba(37,99,235,.24) 24%, rgba(15,23,42,0) 62%);
          filter: blur(2px);
          animation: portalGlow 4.8s ease-in-out infinite;
          z-index: 0;
        }

        .login-portal::after {
          content: "";
          position: absolute;
          left: 18%;
          right: 18%;
          bottom: 20%;
          height: 54px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(56,189,248,.36), rgba(37,99,235,.20) 40%, transparent 72%);
          filter: blur(14px);
          z-index: 1;
        }

        .portal-particle {
          position: absolute;
          border-radius: 999px;
          background: linear-gradient(135deg, #A7F3D0, #60A5FA);
          box-shadow: 0 0 18px rgba(34,211,238,.58);
          opacity: .78;
          z-index: 2;
        }

        .portal-particle.is-one {
          width: 10px;
          height: 10px;
          left: 28%;
          top: 32%;
        }

        .portal-particle.is-two {
          width: 6px;
          height: 6px;
          right: 31%;
          top: 30%;
          opacity: .64;
        }

        .portal-particle.is-three {
          width: 11px;
          height: 11px;
          right: 24%;
          bottom: 38%;
          opacity: .46;
        }

        .portal-ring {
          position: absolute;
          width: 46px;
          height: 46px;
          left: 22%;
          top: 43%;
          border-radius: 999px;
          border: 1px solid rgba(34,211,238,.38);
          opacity: .42;
          z-index: 1;
        }

        .portal-scene {
          position: relative;
          width: min(540px, 96%);
          height: 390px;
          z-index: 3;
          perspective: 900px;
          animation: portalFloat 7s ease-in-out infinite;
        }

        .portal-platform {
          position: absolute;
          left: 18%;
          right: 17%;
          bottom: 91px;
          height: 44px;
          border-radius: 50%;
          background:
            linear-gradient(180deg, rgba(96,165,250,.70), rgba(6,18,38,.96)),
            radial-gradient(ellipse at 50% 14%, rgba(125,211,252,.46), transparent 58%);
          border: 1px solid rgba(147,197,253,.24);
          box-shadow: 0 28px 52px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.16);
          transform: rotateX(62deg);
        }

        .portal-back {
          position: absolute;
          left: 35%;
          top: 10%;
          width: 154px;
          height: 270px;
          border-radius: 32px 16px 18px 18px;
          background:
            linear-gradient(180deg, rgba(218,252,255,.95) 0%, rgba(94,234,212,.82) 47%, rgba(14,165,233,.42) 100%);
          border: 2px solid rgba(191,219,254,.70);
          box-shadow:
            0 0 48px rgba(34,211,238,.86),
            0 0 118px rgba(37,99,235,.50),
            inset 0 0 28px rgba(255,255,255,.40);
          animation: portalGlow 5.2s ease-in-out infinite;
        }

        .portal-frame-line {
          position: absolute;
          left: 43%;
          top: 36%;
          width: 148px;
          height: 170px;
          border-radius: 40px 18px 22px 18px;
          border: 2px solid rgba(191,219,254,.72);
          box-shadow: 0 0 22px rgba(96,165,250,.38);
          z-index: 4;
        }

        .portal-door {
          position: absolute;
          left: 56%;
          top: 28%;
          width: 150px;
          height: 238px;
          border-radius: 8px 44px 24px 8px;
          background:
            linear-gradient(145deg, rgba(5,16,36,.98), rgba(8,31,69,.98) 56%, rgba(23,55,126,.96));
          border: 1px solid rgba(191,219,254,.20);
          box-shadow:
            -18px 0 38px rgba(34,211,238,.22),
            22px 30px 64px rgba(0,0,0,.40),
            inset 1px 0 0 rgba(255,255,255,.12);
          transform-origin: left center;
          animation: portalDoorFloat 6.2s ease-in-out infinite;
          overflow: hidden;
          z-index: 5;
        }

        .portal-door::after {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 40%;
          background: linear-gradient(90deg, rgba(96,165,250,.14), transparent);
        }

        .portal-mini-chart {
          position: absolute;
          right: 34px;
          top: 116px;
          display: flex;
          align-items: flex-end;
          gap: 9px;
          animation: portalChartGlow 4.4s ease-in-out infinite;
        }

        .portal-mini-chart span {
          width: 12px;
          border-radius: 999px 999px 2px 2px;
          background: linear-gradient(180deg, #5EEAD4, #0EA5E9);
          box-shadow: 0 0 14px rgba(94,234,212,.48);
        }

        .portal-handle {
          position: absolute;
          left: 29px;
          top: 145px;
          width: 48px;
          height: 9px;
          border-radius: 999px;
          background: linear-gradient(90deg, #BFDBFE, #2563EB);
          box-shadow: 0 0 16px rgba(147,197,253,.48);
        }

        .portal-handle::before {
          content: "";
          position: absolute;
          left: -8px;
          top: -5px;
          width: 17px;
          height: 17px;
          border-radius: 999px;
          background: #93C5FD;
          box-shadow: 0 0 18px rgba(147,197,253,.58);
        }

        .portal-step {
          position: absolute;
          left: 38%;
          height: 25px;
          border-radius: 6px;
          background:
            linear-gradient(180deg, rgba(147,197,253,.94), rgba(37,99,235,.72) 46%, rgba(7,24,58,.98));
          border: 1px solid rgba(191,219,254,.30);
          box-shadow: 0 14px 24px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.22);
          transform: skewX(-17deg);
          z-index: 6;
        }

        .portal-step.is-one {
          width: 170px;
          bottom: 67px;
        }

        .portal-step.is-two {
          width: 230px;
          left: 31%;
          bottom: 38px;
        }

        .portal-step.is-three {
          width: 294px;
          left: 24%;
          bottom: 7px;
        }

        @media (max-width: 980px) {
          .login-portal {
            min-height: 320px;
          }

          .portal-scene {
            transform: scale(.82);
          }

          .portal-ring,
          .portal-particle.is-three {
            display: none;
          }
        }
      `}</style>

      <span className="portal-ring" />
      <span className="portal-particle is-one" />
      <span className="portal-particle is-two" />
      <span className="portal-particle is-three" />

      <div className="portal-scene">
        <div className="portal-platform" />
        <div className="portal-back" />
        <div className="portal-frame-line" />
        <div className="portal-door">
          <div className="portal-mini-chart">
            <span style={{ height: 46 }} />
            <span style={{ height: 64 }} />
            <span style={{ height: 86 }} />
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
