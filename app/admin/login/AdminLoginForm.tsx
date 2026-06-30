"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const otpStep = Boolean(challengeId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const body = otpStep
      ? { challengeId, code }
      : { username, password };

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({ error: "Giriş yapılamadı." })) as {
      error?: string;
      requiresOtp?: boolean;
      challengeId?: string;
      email?: string;
    };

    if (response.ok) {
      if (payload.requiresOtp && payload.challengeId) {
        setChallengeId(payload.challengeId);
        setMaskedEmail(payload.email || "");
        setCode("");
        setMessage("");
        setLoading(false);
        return;
      }
      window.location.href = "/admin";
      return;
    }

    setMessage(payload.error || "Giriş yapılamadı.");
    setLoading(false);
  }

  function resetOtpStep() {
    setChallengeId("");
    setMaskedEmail("");
    setCode("");
    setMessage("");
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-shell" aria-label="Ödedimi admin girişi">
        <div className="admin-login-intro">
          <div className="admin-login-logo">
            <Image src="/images/odedimi-logo.svg" alt="Ödedimi" width={154} height={49} priority />
          </div>
          <div>
            <span className="admin-login-pill"><ShieldCheck size={15} /> Sahip erişimi</span>
            <h1>Kontrol paneline güvenli giriş</h1>
            <p>
              Kullanıcılar, ödeme kayıtları, trafik verileri ve admin işlemleri tek panelden yönetilir.
            </p>
          </div>
          <div className="admin-login-checks" aria-label="Güvenlik özellikleri">
            <div><ShieldCheck size={18} /><span>Server-side yetki kontrolü</span></div>
            <div><LockKeyhole size={18} /><span>HttpOnly oturum cookie&apos;si</span></div>
            <div><ArrowRight size={18} /><span>Tüm kritik işlemlerde audit log</span></div>
          </div>
        </div>

        <form className="admin-login-card" onSubmit={submit}>
          <div className="admin-login-card-head">
            <span className="admin-login-icon"><LockKeyhole size={21} /></span>
            <div>
              <h2>Admin girişi</h2>
              <p>
                {otpStep
                  ? "E-postana gelen 6 haneli kodu gir."
                  : "Yalnızca tanımlı sahip hesabı erişebilir."}
              </p>
            </div>
          </div>

          {!otpStep ? (
            <>
              <label>
                Kullanıcı adı
                <span className="admin-login-input">
                  <Mail size={18} />
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="selimdelikara"
                    required
                  />
                </span>
              </label>

              <label>
                Şifre
                <span className="admin-login-input">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Hesap şifren"
                    required
                  />
                  <button
                    type="button"
                    className="admin-login-ghost"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
            </>
          ) : (
            <>
              <div className="admin-login-footnote">
                Doğrulama kodu {maskedEmail || "admin e-posta adresine"} gönderildi. Kod 10 dakika geçerli.
              </div>
              <label>
                Doğrulama kodu
                <span className="admin-login-input admin-login-code-input">
                  <ShieldCheck size={18} />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    minLength={6}
                    maxLength={6}
                    required
                  />
                </span>
              </label>
            </>
          )}

          {message ? <p className="admin-login-error">{message}</p> : null}

          <button className="admin-login-submit" type="submit" disabled={loading}>
            {loading
              ? otpStep
                ? "Kod doğrulanıyor..."
                : "Yetki kontrol ediliyor..."
              : otpStep
                ? "Kodu doğrula"
                : "Panele giriş yap"}
            <ArrowRight size={18} />
          </button>

          {otpStep ? (
            <button className="admin-login-secondary" type="button" onClick={resetOtpStep} disabled={loading}>
              Kullanıcı adı ve şifreye dön
            </button>
          ) : null}

          {!otpStep ? <div className="admin-login-footnote">
            Bu giriş yalnızca server tarafında tanımlı sahip bilgileriyle çalışır.
          </div> : null}
        </form>
      </section>
      <style jsx global>{`
        body {
          margin: 0;
          background: #f4f7fb;
          color: #172033;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .admin-login-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px 18px;
          background:
            radial-gradient(circle at 18% 18%, rgba(29, 78, 216, 0.10), transparent 28%),
            linear-gradient(135deg, #f8fbff 0%, #edf4ff 48%, #f9fbff 100%);
        }
        .admin-login-shell {
          width: min(100%, 1040px);
          min-height: 620px;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(380px, 0.92fr);
          overflow: hidden;
          border: 1px solid #d8e4f5;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.13);
        }
        .admin-login-intro {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 28px;
          padding: 42px;
          color: #ffffff;
          background:
            linear-gradient(150deg, rgba(16, 33, 63, 0.96), rgba(29, 78, 216, 0.88)),
            url("/login-portal-reference.webp") center/cover;
          background-blend-mode: multiply;
        }
        .admin-login-logo {
          width: fit-content;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 16px 40px rgba(2, 6, 23, 0.18);
        }
        .admin-login-card {
          display: grid;
          align-content: center;
          gap: 18px;
          padding: 42px;
          background: #ffffff;
        }
        .admin-login-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 30px;
          width: fit-content;
          border-radius: 999px;
          padding: 0 11px;
          background: rgba(255, 255, 255, 0.14);
          color: #dbeafe;
          font-size: 13px;
          font-weight: 900;
        }
        .admin-login-intro h1 {
          max-width: 520px;
          margin: 18px 0 12px;
          font-size: 44px;
          line-height: 1.05;
          letter-spacing: 0;
        }
        .admin-login-intro p {
          max-width: 480px;
          margin: 0;
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.65;
        }
        .admin-login-checks {
          display: grid;
          gap: 12px;
        }
        .admin-login-checks div {
          display: flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 8px;
          padding: 11px 13px;
          background: rgba(255, 255, 255, 0.10);
          color: #eff6ff;
          font-size: 14px;
          font-weight: 800;
        }
        .admin-login-card-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 4px;
        }
        .admin-login-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border-radius: 8px;
          background: #eaf1ff;
          color: #1d4ed8;
        }
        .admin-login-card h2 {
          margin: 0;
          font-size: 26px;
          letter-spacing: 0;
        }
        .admin-login-card-head p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 14px;
        }
        .admin-login-card label {
          display: grid;
          gap: 8px;
          font-size: 13px;
          font-weight: 900;
          color: #53627a;
        }
        .admin-login-input {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 10px;
          min-height: 48px;
          border: 1px solid #cbd8ea;
          border-radius: 8px;
          padding: 0 12px;
          color: #64748b;
          background: #fbfdff;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }
        .admin-login-input:focus-within {
          border-color: #1d4ed8;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.10);
        }
        .admin-login-card input {
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          font: inherit;
          color: #172033;
        }
        .admin-login-code-input input {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 6px;
        }
        .admin-login-ghost {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }
        .admin-login-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 50px;
          border: 0;
          border-radius: 8px;
          background: #1d4ed8;
          color: #fff;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(29, 78, 216, 0.20);
        }
        .admin-login-submit:disabled {
          opacity: 0.65;
          cursor: wait;
          box-shadow: none;
        }
        .admin-login-secondary {
          min-height: 44px;
          border: 1px solid #cbd8ea;
          border-radius: 8px;
          background: #ffffff;
          color: #1d4ed8;
          font-weight: 900;
          cursor: pointer;
        }
        .admin-login-secondary:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        .admin-login-error {
          margin: 0;
          padding: 12px 13px;
          border: 1px solid #fecdd3;
          border-radius: 8px;
          background: #fff1f2;
          color: #be123c;
          font-size: 13px;
          font-weight: 800;
        }
        .admin-login-footnote {
          border-radius: 8px;
          padding: 12px 13px;
          background: #f8fbff;
          color: #64748b;
          font-size: 12px;
          line-height: 1.55;
        }
        @media (max-width: 860px) {
          .admin-login-shell {
            min-height: auto;
            grid-template-columns: 1fr;
          }
          .admin-login-intro {
            min-height: 310px;
            padding: 28px;
          }
          .admin-login-intro h1 {
            font-size: 34px;
          }
          .admin-login-card {
            padding: 28px;
          }
        }
        @media (max-width: 520px) {
          .admin-login-page {
            padding: 12px;
          }
          .admin-login-intro {
            padding: 22px;
          }
          .admin-login-intro h1 {
            font-size: 29px;
          }
          .admin-login-checks div {
            width: auto;
          }
          .admin-login-card {
            padding: 22px;
          }
        }
      `}</style>
    </main>
  );
}
