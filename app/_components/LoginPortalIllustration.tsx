"use client";

import Image from "next/image";

export function LoginPortalIllustration() {
  return (
    <div className="login-portal" aria-hidden="true">
      <style>{`
        @keyframes portalImageGlow {
          0%, 100% {
            opacity: .18;
            transform: translate3d(-50%, -50%, 0) scale(.96);
          }
          50% {
            opacity: .34;
            transform: translate3d(-50%, -50%, 0) scale(1.04);
          }
        }

        .login-portal {
          position: relative;
          min-height: 430px;
          height: 100%;
          display: grid;
          place-items: center;
          overflow: hidden;
          isolation: isolate;
          background: #06132b;
        }

        .login-portal::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 48%;
          width: 42%;
          height: 46%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(94,234,212,.82), rgba(37,99,235,.42) 36%, transparent 72%);
          filter: blur(22px);
          mix-blend-mode: screen;
          pointer-events: none;
          animation: portalImageGlow 4.2s ease-in-out infinite;
          z-index: 2;
        }

        .login-portal-image {
          position: relative;
          z-index: 1;
          width: min(100%, 720px);
          height: auto;
          display: block;
          user-select: none;
          pointer-events: none;
        }

        @media (max-width: 980px) {
          .login-portal {
            min-height: 320px;
          }

          .login-portal-image {
            width: min(112%, 620px);
          }
        }
      `}</style>

      <Image
        className="login-portal-image"
        src="/login-portal-reference.png"
        alt=""
        width={1536}
        height={864}
        priority
        sizes="(max-width: 980px) 100vw, 58vw"
      />
    </div>
  );
}
