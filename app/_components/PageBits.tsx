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
    <div style={styles.stat}>
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
  const authTitle = isMobileViewport ? "Giriş Yap" : signupMode ? "Hesap Oluştur" : "Giriş Yap";
  const primaryLabel = isMobileViewport
    ? "Giriş Yap"
    : signupMode
      ? "Hesap Oluştur"
      : "Giriş Yap";

  return (
    <div style={{ ...styles.loginWrap, ...themeVars }} className="login-wrap">
      <div style={styles.loginShell} className="login-shell">
        <div style={styles.loginShowcase} className="login-showcase">
          <div style={styles.loginOrbOne} />
          <div style={styles.loginOrbTwo} />
          <div style={styles.loginOrbThree} />

          <div style={styles.loginBrand} className="login-brand">
            Ã–DEDÄ° MÄ°
          </div>
          <h1 style={styles.loginHeadline} className="login-headline">
            ParacÄ±klar Geldi Mi Acep...
          </h1>
        </div>

        <div style={styles.loginCard} className="login-card">
          <div style={styles.loginCardTitle}>{authTitle}</div>

          <div style={styles.loginSection}>
            <div style={styles.loginLabel}>E-posta</div>
            <input
              className="soft-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.loginInput}
            />
            <div style={styles.loginLabel}>Åifre</div>
            <input
              className="soft-input"
              type="password"
              placeholder="Åifre"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={styles.loginInput}
            />
            <div style={styles.loginMetaRow}>
              <label style={styles.rememberMeLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Beni HatÄ±rla</span>
              </label>
              <button
                type="button"
                className="hover-button"
                onClick={() => void authResetPassword()}
                style={styles.forgotLink}
              >
                Åifremi Unuttum
              </button>
            </div>
            <button
              className="hover-button"
              onClick={() => void (isMobileViewport ? authLogin() : signupMode ? authSignUp() : authLogin())}
              style={styles.loginPrimaryAction}
            >
              <span style={styles.btnInner}>
                <Mail size={16} />
                {primaryLabel}
              </span>
            </button>
          </div>

          <div style={styles.loginDividerText} className="login-signup-block">
            <span style={styles.loginDividerTextLine} />
            <span>Veya hesap oluÅŸtur</span>
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
              title="Normal e-posta ile hesap oluÅŸtur"
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
              GiriÅŸ ekranÄ±na dÃ¶n
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
          <h2 style={styles.h2}>Hesap AyarlarÄ±</h2>
          <Settings2 size={18} color={mutedColor} />
        </div>

        <div style={styles.settingsProfileRow}>
          <div style={styles.settingsAvatar}>
            {settingsAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settingsAvatarUrl}
                alt="Profil fotoÄŸrafÄ±"
                style={styles.settingsAvatarImage}
              />
            ) : (
              <span>{(settingsName || authEmail || "U").slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={styles.settingsMetaLabel}>GÃ¶rÃ¼nen Ad</div>
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
                  FotoÄŸraf YÃ¼kle
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
          <h2 style={styles.h2}>GÃ¼venlik</h2>
          <LockKeyhole size={18} color={mutedColor} />
        </div>

        <div style={styles.settingsStack}>
          <div>
            <div style={styles.settingsMetaLabel}>Yeni Åifre</div>
            <input
              className="soft-input"
              type="password"
              value={settingsPassword}
              onChange={(e) => setSettingsPassword(e.target.value)}
              placeholder="Yeni ÅŸifre"
              style={styles.input}
            />
          </div>
          <div>
            <div style={styles.settingsMetaLabel}>Yeni Åifre Tekrar</div>
            <input
              className="soft-input"
              type="password"
              value={settingsPasswordRepeat}
              onChange={(e) => setSettingsPasswordRepeat(e.target.value)}
              placeholder="Yeni ÅŸifre tekrar"
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
                Åifreyi GÃ¼ncelle
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
                SÄ±fÄ±rlama BaÄŸlantÄ±sÄ± GÃ¶nder
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
            Bu iÅŸlem hesabÄ±, panel verilerini ve yÃ¼klenen dosyalarÄ± kalÄ±cÄ± olarak siler.
          </div>
          {authProviders.includes("email") ? (
            <div>
              <div style={styles.settingsMetaLabel}>Mevcut Åifre</div>
              <input
                className="soft-input"
                type="password"
                value={settingsCurrentPassword}
                onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                placeholder="Mevcut ÅŸifre"
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
              HesabÄ± Kapat
            </span>
          </button>
        </div>
      </div>

      <div style={styles.settingsCard}>
        <div style={styles.sectionHead}>
          <h2 style={styles.h2}>Ä°ÅŸlem GeÃ§miÅŸi</h2>
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
          <div style={styles.settingsDangerText}>HenÃ¼z kayÄ±tlÄ± bir iÅŸlem yok.</div>
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
                  {shortDate(row.fatura_tarihi)} Â· {row.tutar ? tl(Number(row.tutar)) : "â€”"}
                </div>
              </div>
              <div
                style={{
                  ...styles.status,
                  background: durum.bg,
                  color: durum.color,
                  border: `1px solid ${durum.color}55`,
                }}
              >
                <span style={{ ...styles.dot, background: durum.color }} />
                {durum.text}
              </div>
            </div>

            <div style={styles.mobileProjectSubMeta}>
              <span>OluÅŸturma: {shortDateTime(meta?.createdAt || null)}</span>
              <span>GÃ¼ncelleme: {shortDateTime(meta?.updatedAt || null)}</span>
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
                DÃ¼zenle
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



