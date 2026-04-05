"use client";

import {
  CircleAlert,
  ImageUp,
  KeyRound,
  LockKeyhole,
  Mail,
  Settings2,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  type CSSProperties,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { tl } from "../page.helpers";
import type { ActivityItem, InvoiceAttachment, Odeme, RowMeta } from "../page.shared";

export function AnimatedMoney({
  value,
  strong = false,
}: {
  value: number;
  strong?: boolean;
}) {
  const [shown, setShown] = useState(value);
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    if (start === end) return;

    // Animation state intentionally toggles from the effect when the value changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 500);
    const duration = 700;
    const startTime = performance.now();

    const run = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(start + (end - start) * eased);
      if (p < 1) requestAnimationFrame(run);
      else prev.current = end;
    };

    requestAnimationFrame(run);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <div
      style={{
        fontSize: strong ? 22 : 16,
        fontWeight: strong ? 900 : 700,
        color: strong ? "var(--blue)" : "var(--textSoft)",
        letterSpacing: strong ? "-0.6px" : "-0.2px",
        fontVariantNumeric: "tabular-nums",
        transition: "all .25s ease",
        padding: strong ? "2px 4px" : 0,
        borderRadius: 10,
        ...(flash
          ? {
              boxShadow:
                "0 0 0 6px rgba(37,99,235,.08), 0 8px 24px rgba(37,99,235,.18)",
            }
          : {}),
      }}
    >
      {tl(shown)}
    </div>
  );
}

export function Stat({
  title,
  value,
  icon,
  styles,
  iconWrapStyle,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  styles: Record<string, CSSProperties>;
  iconWrapStyle?: CSSProperties;
}) {
  return (
    <div style={styles.stat} className="motion-card">
      <div style={styles.statBody}>
        <div style={{ ...styles.statIcon, ...iconWrapStyle }}>{icon}</div>
        <div style={styles.statCopy}>
          <div style={styles.statLabel}>{title}</div>
          <div style={styles.statValue}>{value}</div>
        </div>
      </div>
    </div>
  );
}

type AuthScreenProps = {
  themeVars: CSSProperties;
  isMobileViewport: boolean;
  signupMode: boolean;
  setSignupMode: Dispatch<SetStateAction<boolean>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  authPassword: string;
  setAuthPassword: Dispatch<SetStateAction<string>>;
  rememberMe: boolean;
  setRememberMe: Dispatch<SetStateAction<boolean>>;
  authResetPassword: () => Promise<void>;
  authSignUp: () => Promise<void>;
  authLogin: () => Promise<void>;
  authLoginWithGoogle: () => Promise<void>;
  msg: string;
  styles: Record<string, CSSProperties>;
};

export function AuthScreen({
  themeVars,
  isMobileViewport,
  signupMode,
  setSignupMode,
  email,
  setEmail,
  authPassword,
  setAuthPassword,
  rememberMe,
  setRememberMe,
  authResetPassword,
  authSignUp,
  authLogin,
  authLoginWithGoogle,
  msg,
  styles,
}: AuthScreenProps) {
  const [showMobileForm, setShowMobileForm] = useState(false);

  const authTitle = isMobileViewport ? "Giriş Yap" : signupMode ? "Hesap Oluştur" : "Giriş Yap";
  const primaryLabel = isMobileViewport
    ? "Giriş Yap"
    : signupMode
      ? "Hesap Oluştur"
      : "Giriş Yap";

  if (isMobileViewport && !showMobileForm) {
    return (
      <div style={{ ...styles.loginWrap, ...themeVars }} className="login-wrap mobile-auth-wrap">
        <div style={styles.mobileIntroShell} className="mobile-auth-intro">
          <div style={styles.mobileIntroMarkWrap}>
            <div style={styles.mobileIntroMarkQuestion}>?</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cat-question-source.jpg"
              alt="Soru işaretli kedi"
              style={styles.mobileIntroMarkImage}
            />
          </div>
          <div style={styles.mobileIntroCopy}>Paracıklar Geldi Mi Acep...</div>
          <button
            type="button"
            className="hover-button mobile-auth-cta"
            onClick={() => setShowMobileForm(true)}
            style={styles.mobileIntroButton}
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  if (isMobileViewport) {
    return (
      <div style={{ ...styles.loginWrap, ...themeVars }} className="login-wrap mobile-auth-wrap">
        <div style={styles.mobileAuthFormShell} className="mobile-auth-form-shell">
          <div style={styles.loginCardTitle} className="login-card-title">
            Giriş Yap
          </div>

          <div style={styles.loginSection} className="login-section">
            <div style={styles.loginLabel} className="login-label">
              E-posta
            </div>
            <input
              className="soft-input login-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.loginInput}
            />
            <div style={styles.loginLabel} className="login-label">
              Şifre
            </div>
            <input
              className="soft-input login-input"
              type="password"
              placeholder="Şifre"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={styles.loginInput}
            />
            <div style={styles.loginMetaRow} className="login-meta-row">
              <label style={styles.rememberMeLabel} className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Beni Hatırla</span>
              </label>
              <button
                type="button"
                className="hover-button forgot-link"
                onClick={() => void authResetPassword()}
                style={styles.forgotLink}
              >
                Şifremi Unuttum
              </button>
            </div>
            <button
              className="hover-button mobile-auth-cta"
              onClick={() => void authLogin()}
              style={styles.mobileAuthPrimaryButton}
              type="button"
            >
              <span style={styles.btnInner}>
                <Mail size={16} />
                Giriş Yap
              </span>
            </button>
          </div>

          {msg ? <div style={{ ...styles.msg, marginTop: 14 }}>{msg}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.loginWrap, ...themeVars }} className="login-wrap">
      <div style={styles.loginShell} className="login-shell">
        {!isMobileViewport ? (
          <div style={styles.loginShowcase} className="login-showcase">
            <div style={styles.loginOrbOne} />
            <div style={styles.loginOrbTwo} />
            <div style={styles.loginOrbThree} />

            <div style={styles.loginBrand} className="login-brand">
              ÖDEDİ Mİ
            </div>
            <h1 style={styles.loginHeadline} className="login-headline">
              Paracıklar Geldi Mi Acep...
            </h1>
          </div>
        ) : null}

        <div style={styles.loginCard} className="login-card">
          <div style={styles.loginCardTitle} className="login-card-title">
            {authTitle}
          </div>

          <div style={styles.loginSection} className="login-section">
            <div style={styles.loginLabel} className="login-label">
              E-posta
            </div>
            <input
              className="soft-input login-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.loginInput}
            />
            <div style={styles.loginLabel} className="login-label">
              Şifre
            </div>
            <input
              className="soft-input login-input"
              type="password"
              placeholder="Şifre"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={styles.loginInput}
            />
            <div style={styles.loginMetaRow} className="login-meta-row">
              <label style={styles.rememberMeLabel} className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Beni Hatırla</span>
              </label>
              <button
                type="button"
                className="hover-button forgot-link"
                onClick={() => void authResetPassword()}
                style={styles.forgotLink}
              >
                Şifremi Unuttum
              </button>
            </div>
            <button
              className="hover-button"
              onClick={() => void (isMobileViewport ? authLogin() : signupMode ? authSignUp() : authLogin())}
              style={styles.loginPrimaryAction}
              type="button"
            >
              <span style={styles.btnInner}>
                <Mail size={16} />
                {primaryLabel}
              </span>
            </button>
          </div>

          <div style={styles.loginDividerText} className="login-signup-block">
            <span style={styles.loginDividerTextLine} />
            <span>Veya hesap oluştur</span>
            <span style={styles.loginDividerTextLine} />
          </div>

          <div style={styles.loginSocialRow} className="login-signup-block">
            <button
              className="hover-button"
              onClick={() => void authLoginWithGoogle()}
              style={styles.googleIconBtn}
            >
              <span style={styles.googleMark}>
                <span style={{ color: "#4285F4" }}>G</span>
              </span>
            </button>
            <button
              className="hover-button"
              onClick={() => setSignupMode(true)}
              style={styles.mailIconBtn}
              title="Normal e-posta ile hesap oluştur"
            >
              <Mail size={18} />
            </button>
          </div>

          {signupMode ? (
            <button
              type="button"
              className="hover-button"
              onClick={() => setSignupMode(false)}
              style={styles.switchAuthLink}
            >
              Giriş ekranına dön
            </button>
          ) : null}

          {msg ? <div style={{ ...styles.msg, marginTop: 14 }}>{msg}</div> : null}
        </div>
      </div>
    </div>
  );
}

type SettingsContentProps = {
  mutedColor: string;
  redColor: string;
  styles: Record<string, CSSProperties>;
  settingsAvatarUrl: string | null;
  settingsName: string;
  setSettingsName: Dispatch<SetStateAction<string>>;
  authEmail: string | null;
  profileInputRef: MutableRefObject<HTMLInputElement | null>;
  settingsBusy: boolean;
  saveProfileSettings: () => Promise<void>;
  settingsPassword: string;
  setSettingsPassword: Dispatch<SetStateAction<string>>;
  settingsPasswordRepeat: string;
  setSettingsPasswordRepeat: Dispatch<SetStateAction<string>>;
  changePassword: () => Promise<void>;
  authResetPassword: () => Promise<void>;
  authProviders: string[];
  settingsCurrentPassword: string;
  setSettingsCurrentPassword: Dispatch<SetStateAction<string>>;
  closeAccountData: () => Promise<void>;
  activityLog: ActivityItem[];
};

export function SettingsContent({
  mutedColor,
  redColor,
  styles,
  settingsAvatarUrl,
  settingsName,
  setSettingsName,
  authEmail,
  profileInputRef,
  settingsBusy,
  saveProfileSettings,
  settingsPassword,
  setSettingsPassword,
  settingsPasswordRepeat,
  setSettingsPasswordRepeat,
  changePassword,
  authResetPassword,
  authProviders,
  settingsCurrentPassword,
  setSettingsCurrentPassword,
  closeAccountData,
  activityLog,
}: SettingsContentProps) {
  return (
    <div style={styles.settingsGrid}>
      <div style={styles.settingsCard}>
        <div style={styles.sectionHead}>
          <h2 style={styles.h2}>Hesap Ayarları</h2>
          <Settings2 size={18} color={mutedColor} />
        </div>

        <div style={styles.settingsProfileRow}>
          <div style={styles.settingsAvatar}>
            {settingsAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settingsAvatarUrl}
                alt="Profil fotoğrafı"
                style={styles.settingsAvatarImage}
              />
            ) : (
              <span>{(settingsName || authEmail || "U").slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={styles.settingsMetaLabel}>Görünen Ad</div>
              <input
                className="soft-input"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                placeholder="Ad Soyad"
                style={styles.input}
              />
            </div>
            <div>
              <div style={styles.settingsMetaLabel}>E-posta</div>
              <div style={styles.settingsEmail}>{authEmail || "â€”"}</div>
            </div>
            <div style={styles.settingsButtonRow}>
              <button
                className="hover-button"
                onClick={() => profileInputRef.current?.click()}
                style={styles.settingsGhostBtn}
                disabled={settingsBusy}
              >
                <span style={styles.btnInner}>
                  <ImageUp size={15} />
                  Fotoğraf Yükle
                </span>
              </button>
              <button
                className="hover-button"
                onClick={() => void saveProfileSettings()}
                style={styles.primaryBtn}
                disabled={settingsBusy}
              >
                <span style={styles.btnInner}>
                  <UserRound size={15} />
                  Profili Kaydet
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.settingsCard}>
        <div style={styles.sectionHead}>
          <h2 style={styles.h2}>Güvenlik</h2>
          <LockKeyhole size={18} color={mutedColor} />
        </div>

        <div style={styles.settingsStack}>
          <div>
            <div style={styles.settingsMetaLabel}>Yeni Şifre</div>
            <input
              className="soft-input"
              type="password"
              value={settingsPassword}
              onChange={(e) => setSettingsPassword(e.target.value)}
              placeholder="Yeni Şifre"
              style={styles.input}
            />
          </div>
          <div>
            <div style={styles.settingsMetaLabel}>Yeni Şifre Tekrar</div>
            <input
              className="soft-input"
              type="password"
              value={settingsPasswordRepeat}
              onChange={(e) => setSettingsPasswordRepeat(e.target.value)}
              placeholder="Yeni Şifre tekrar"
              style={styles.input}
            />
          </div>
          <div style={styles.settingsButtonRow}>
            <button
              className="hover-button"
              onClick={() => void changePassword()}
              style={styles.secondaryBtn}
              disabled={settingsBusy}
            >
              <span style={styles.btnInner}>
                <KeyRound size={15} />
                Şifreyi Güncelle
              </span>
            </button>
            <button
              className="hover-button"
              onClick={() => void authResetPassword()}
              style={styles.settingsGhostBtn}
              disabled={settingsBusy}
            >
              <span style={styles.btnInner}>
                <Mail size={15} />
                Sıfırlama Bağlantısı Gönder
              </span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...styles.settingsCard, ...styles.settingsDangerCard }}>
        <div style={styles.sectionHead}>
          <h2 style={{ ...styles.h2, color: "var(--red)" }}>Tehlikeli Alan</h2>
          <CircleAlert size={18} color={redColor} />
        </div>
        <div style={styles.settingsStack}>
          <div style={styles.settingsDangerText}>
            Bu işlem hesabı, panel verilerini ve yüklenen dosyaları kalıcı olarak siler.
          </div>
          {authProviders.includes("email") ? (
            <div>
              <div style={styles.settingsMetaLabel}>Mevcut Şifre</div>
              <input
                className="soft-input"
                type="password"
                value={settingsCurrentPassword}
                onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                placeholder="Mevcut Şifre"
                style={styles.input}
              />
            </div>
          ) : null}
          <button
            className="hover-button"
            onClick={() => void closeAccountData()}
            style={styles.deleteBtn}
            disabled={settingsBusy}
          >
            <span style={styles.btnInner}>
              <Trash2 size={15} />
              Hesabı Kapat
            </span>
          </button>
        </div>
      </div>

      <div style={styles.settingsCard}>
        <div style={styles.sectionHead}>
          <h2 style={styles.h2}>İşlem Geçmişi</h2>
          <CircleAlert size={18} color={mutedColor} />
        </div>
        {activityLog.length ? (
          <div style={styles.settingsHistoryList}>
            {activityLog.map((item) => (
              <div key={item.id} style={styles.settingsHistoryItem}>
                <div style={styles.settingsHistoryTitleRow}>
                  <strong>{item.title}</strong>
                  <span style={styles.settingsHistoryTime}>{item.createdAt}</span>
                </div>
                <div style={styles.settingsHistoryDetail}>{item.detail}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.settingsDangerText}>Henüz kayıtlı bir işlem yok.</div>
        )}
      </div>
    </div>
  );
}

type EmptyStateCardProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  styles: Record<string, CSSProperties>;
};

export function EmptyStateCard({
  title,
  description,
  actionLabel,
  onAction,
  styles,
}: EmptyStateCardProps) {
  return (
    <div style={styles.emptyStateCard}>
      <div style={styles.emptyStateTitle}>{title}</div>
      <div style={styles.emptyStateText}>{description}</div>
      {actionLabel && onAction ? (
        <button className="hover-button" type="button" onClick={onAction} style={styles.primaryBtn}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

type MobileProjectCardsProps = {
  rows: Odeme[];
  invoiceMap: Record<number, InvoiceAttachment[]>;
  rowMeta: Record<number, RowMeta>;
  aktifTabMeta: { color: string };
  styles: Record<string, CSSProperties>;
  shortDate: (v: string | null) => string;
  shortDateTime: (v: string | null) => string;
  tl: (v: number) => string;
  durumGorunum: (row: Odeme) => {
    text: string;
    bg: string;
    color: string;
    rowBg: string;
  };
  durumIlerle: (row: Odeme) => Promise<void>;
  editAc: (row: Odeme) => void;
  kayitSil: (id: number) => Promise<void>;
  openInvoicePicker: (rowId: number) => void;
  uploadingInvoiceId: number | null;
};

export function MobileProjectCards({
  rows,
  invoiceMap,
  rowMeta,
  aktifTabMeta,
  styles,
  shortDate,
  shortDateTime,
  tl,
  durumGorunum,
  durumIlerle,
  editAc,
  kayitSil,
  openInvoicePicker,
  uploadingInvoiceId,
}: MobileProjectCardsProps) {
  return (
    <div style={styles.mobileProjectList}>
      {rows.map((row) => {
        const invoices = invoiceMap[row.id] || [];
        const meta = rowMeta[row.id];
        const durum = durumGorunum(row);

        return (
          <div
            key={row.id}
            style={{
              ...styles.mobileProjectCard,
              borderLeft: `4px solid ${aktifTabMeta.color}`,
            }}
          >
            <div style={styles.mobileProjectHead}>
              <div>
                <div style={styles.mobileProjectTitle}>{row.proje || "â€”"}</div>
                <div style={styles.mobileProjectMeta}>
                  {shortDate(row.fatura_tarihi)} · {row.tutar ? tl(Number(row.tutar)) : "—"}
                </div>
              </div>
              <button
                className="status-button"
                type="button"
                onClick={() => void durumIlerle(row)}
                style={{
                  ...styles.status,
                  background: durum.bg,
                  color: durum.color,
                  border: `1px solid ${durum.color}55`,
                }}
              >
                <span style={{ ...styles.dot, background: durum.color }} />
                {durum.text}
              </button>
            </div>

            <div style={styles.mobileProjectSubMeta}>
              <span>Oluşturma: {shortDateTime(meta?.createdAt || null)}</span>
              <span>Güncelleme: {shortDateTime(meta?.updatedAt || null)}</span>
            </div>

            {invoices.length ? (
              <div style={styles.invoiceList}>
                {invoices.map((attachment) => (
                  <a
                    key={attachment.path}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.invoiceLink}
                  >
                    {attachment.name}
                  </a>
                ))}
              </div>
            ) : null}

            <div style={styles.mobileProjectActions}>
              <button className="hover-button" type="button" onClick={() => editAc(row)} style={styles.secondaryBtn}>
                Düzenle
              </button>
              <button
                className="hover-button"
                type="button"
                onClick={() => openInvoicePicker(row.id)}
                style={styles.secondaryBtn}
                disabled={uploadingInvoiceId === row.id}
              >
                Fatura
              </button>
              <button className="hover-button" type="button" onClick={() => void kayitSil(row.id)} style={styles.deleteBtn}>
                Sil
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}



