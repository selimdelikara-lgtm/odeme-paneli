"use client";

export function LoginPortalIllustration() {
  return (
    <div className="login-portal" aria-hidden="true">
      <style>{`
        @keyframes portalGlowBreath {
          0%, 100% { opacity: .72; transform: scale(.98); filter: blur(0); }
          50% { opacity: 1; transform: scale(1.04); filter: blur(.2px); }
        }
        @keyframes portalDoorFloat {
          0%, 100% { transform: translateY(0) rotateY(-18deg) rotateZ(.2deg); }
          50% { transform: translateY(-5px) rotateY(-18deg) rotateZ(-.4deg); }
        }
        @keyframes portalParticleFloat {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: .42; }
          50% { transform: translate3d(0, -10px, 0); opacity: .8; }
        }
        @keyframes portalPlatformPulse {
          0%, 100% { opacity: .55; transform: scaleX(.94); }
          50% { opacity: .82; transform: scaleX(1); }
        }
        .login-portal {
          position: relative;
          min-height: 430px;
          height: 100%;
          display: grid;
          place-items: center;
          overflow: hidden;
          isolation: isolate;
        }
        .login-portal::before {
          content: "";
          position: absolute;
          inset: 6% 8%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(34,211,238,.22) 0%, rgba(37,99,235,.13) 34%, transparent 67%);
          animation: portalGlowBreath 4.6s ease-in-out infinite;
          z-index: 0;
        }
        .login-portal::after {
          content: "";
          position: absolute;
          width: 62%;
          height: 14%;
          left: 19%;
          bottom: 12%;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(14,165,233,.36), rgba(8,19,38,0) 68%);
          filter: blur(12px);
          animation: portalPlatformPulse 4.2s ease-in-out infinite;
          z-index: 0;
        }
        .portal-particle {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: linear-gradient(135deg, #CFFAFE, #34D399);
          box-shadow: 0 0 18px rgba(34,211,238,.55);
          animation: portalParticleFloat 6s ease-in-out infinite;
          z-index: 1;
        }
        .portal-particle.is-one { left: 24%; top: 24%; animation-delay: -.8s; transform: scale(.72); }
        .portal-particle.is-two { right: 25%; top: 31%; animation-delay: -2.1s; transform: scale(.56); }
        .portal-particle.is-three { left: 31%; bottom: 29%; animation-delay: -3.4s; transform: scale(.46); }
        .portal-scene {
          position: relative;
          width: min(390px, 88%);
          height: 360px;
          z-index: 2;
        }
        .portal-light {
          position: absolute;
          left: 37%;
          top: 16%;
          width: 112px;
          height: 220px;
          border-radius: 24px 16px 12px 12px;
          background: linear-gradient(180deg, rgba(207,250,254,.96), rgba(94,234,212,.88) 62%, rgba(34,211,238,.58));
          box-shadow: 0 0 44px rgba(34,211,238,.72), 0 0 96px rgba(37,99,235,.38);
          animation: portalGlowBreath 4s ease-in-out infinite;
        }
        .portal-frame {
          position: absolute;
          left: 34%;
          top: 13%;
          width: 128px;
          height: 238px;
          border-radius: 28px 22px 16px 16px;
          border: 2px solid rgba(191,219,254,.88);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.20), 0 0 30px rgba(59,130,246,.36);
        }
        .portal-door {
          position: absolute;
          left: 49%;
          top: 13%;
          width: 104px;
          height: 238px;
          border-radius: 8px 30px 18px 8px;
          background: linear-gradient(145deg, #061329 0%, #0B1F45 58%, #102E68 100%);
          border: 1px solid rgba(191,219,254,.30);
          box-shadow: -14px 0 28px rgba(34,211,238,.20), 18px 24px 52px rgba(0,0,0,.34);
          transform-origin: left center;
          animation: portalDoorFloat 6.2s ease-in-out infinite;
        }
        .portal-mini-chart {
          position: absolute;
          right: 22px;
          top: 78px;
          display: flex;
          align-items: flex-end;
          gap: 5px;
        }
        .portal-mini-chart span {
          width: 8px;
          border-radius: 999px 999px 2px 2px;
          background: linear-gradient(180deg, #5EEAD4, #2563EB);
          box-shadow: 0 0 10px rgba(94,234,212,.35);
        }
        .portal-handle {
          position: absolute;
          left: 20px;
          top: 128px;
          width: 34px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, #93C5FD, #1E3A8A);
          box-shadow: 0 0 12px rgba(147,197,253,.38);
        }
        .portal-platform {
          position: absolute;
          left: 18%;
          right: 13%;
          bottom: 74px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(59,130,246,.60), rgba(8,31,69,.90));
          border: 1px solid rgba(147,197,253,.24);
          box-shadow: 0 22px 42px rgba(0,0,0,.34);
        }
        .portal-step {
          position: absolute;
          height: 22px;
          border-radius: 4px;
          background: linear-gradient(180deg, #60A5FA, #0B2B66);
          border: 1px solid rgba(191,219,254,.30);
          box-shadow: 0 10px 22px rgba(0,0,0,.30);
        }
        .portal-step.is-one { width: 150px; left: 35%; bottom: 50px; }
        .portal-step.is-two { width: 190px; left: 29%; bottom: 26px; }
        .portal-step.is-three { width: 230px; left: 23%; bottom: 0; }
        @media (max-width: 980px) {
          .login-portal { min-height: 320px; }
          .portal-scene { transform: scale(.86); }
        }
      `}</style>
      <span className="portal-particle is-one" />
      <span className="portal-particle is-two" />
      <span className="portal-particle is-three" />
      <div className="portal-scene">
        <div className="portal-platform" />
        <div className="portal-light" />
        <div className="portal-frame" />
        <div className="portal-door">
          <div className="portal-mini-chart">
            <span style={{ height: 24 }} />
            <span style={{ height: 36 }} />
            <span style={{ height: 50 }} />
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
