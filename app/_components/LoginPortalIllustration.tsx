"use client";

import Image from "next/image";

export function LoginPortalIllustration() {
  return (
    <div className="login-portal" aria-hidden="true">
      <style>{`
        @keyframes portalImageGlow {
          0%, 100% {
            opacity: .12;
            transform: translate3d(-50%, -50%, 0) scale(.97);
          }
          50% {
            opacity: .28;
            transform: translate3d(-50%, -50%, 0) scale(1.05);
          }
        }

        @keyframes portalDotDrift {
          0%, 100% {
            opacity: .22;
            transform: translate3d(0, 0, 0);
          }
          50% {
            opacity: .42;
            transform: translate3d(7px, -7px, 0);
          }
        }

        @keyframes portalSparkFloat {
          0%, 100% {
            opacity: .36;
            transform: translate3d(0, 0, 0) scale(.92);
          }
          50% {
            opacity: .72;
            transform: translate3d(0, -10px, 0) scale(1.04);
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

        .login-portal-dot-cluster {
          position: absolute;
          width: 150px;
          height: 108px;
          background-image: radial-gradient(circle, rgba(96,165,250,.72) 1.8px, transparent 2px);
          background-size: 18px 18px;
          opacity: .24;
          pointer-events: none;
          animation: portalDotDrift 7s ease-in-out infinite;
          z-index: 3;
        }

        .login-portal-dot-cluster.is-left {
          left: 5%;
          bottom: 28%;
        }

        .login-portal-dot-cluster.is-right {
          right: 7%;
          bottom: 11%;
          animation-delay: -2.6s;
        }

        .login-portal-spark {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #A7F3D0, #60A5FA);
          box-shadow: 0 0 18px rgba(94,234,212,.55);
          pointer-events: none;
          animation: portalSparkFloat 5.4s ease-in-out infinite;
          z-index: 4;
        }

        .login-portal-spark.is-one {
          left: 30%;
          top: 31%;
        }

        .login-portal-spark.is-two {
          right: 32%;
          top: 30%;
          width: 5px;
          height: 5px;
          animation-delay: -1.8s;
        }

        .login-portal-spark.is-three {
          right: 25%;
          bottom: 37%;
          width: 10px;
          height: 10px;
          opacity: .28;
          animation-delay: -3.4s;
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

          .login-portal-dot-cluster,
          .login-portal-spark.is-three {
            display: none;
          }
        }
      `}</style>

      <span className="login-portal-dot-cluster is-left" />
      <span className="login-portal-dot-cluster is-right" />
      <span className="login-portal-spark is-one" />
      <span className="login-portal-spark is-two" />
      <span className="login-portal-spark is-three" />

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
