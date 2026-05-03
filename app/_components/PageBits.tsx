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
      className="money-value"
      data-private-value="true"
      data-mask="₺0"
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
  privateValue = false,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  styles: Record<string, CSSProperties>;
  iconWrapStyle?: CSSProperties;
  privateValue?: boolean;
}) {
  return (
    <div style={styles.stat} className="motion-card">
      <div style={styles.statBody}>
        <div style={{ ...styles.statIcon, ...iconWrapStyle }}>{icon}</div>
        <div style={styles.statCopy}>
          <div style={styles.statLabel}>{title}</div>
          <div
            style={styles.statValue}
            className={privateValue ? "money-value" : undefined}
            data-private-value={privateValue ? "true" : undefined}
            data-mask={privateValue ? "₺0" : undefined}
          >
            {value}
          </div>
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
  authLoginWithFacebook: () => Promise<void>;
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
  authLoginWithFacebook,
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
            <div style={styles.mobileIntroMarkQuestion}>₺</div>
            <div style={styles.mobileIntroMarkImage}>
              <span>?</span>
            </div>
          </div>
          <div style={styles.mobileIntroCopy}>Freelance ödemelerini tek panelde takip et.</div>
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
          <div style={styles.mobileAuthTitle} className="login-card-title">
            Giriş Yap
          </div>

          <div style={styles.loginSection} className="login-section">
            <div style={styles.mobileAuthLabel} className="login-label">
              E-posta
            </div>
            <input
              className="soft-input login-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.mobileAuthInput}
            />
            <div style={styles.mobileAuthLabel} className="login-label">
              Şifre
            </div>
            <input
              className="soft-input login-input"
              type="password"
              placeholder="Şifre"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={styles.mobileAuthInput}
            />
            <div style={styles.mobileAuthMetaRow} className="login-meta-row">
              <label style={styles.mobileAuthRemember} className="remember-me-label">
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
                style={styles.mobileAuthForgot}
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

            <div style={styles.mobileAuthDivider}>
              <span style={styles.mobileAuthDividerLine} />
              <span>veya</span>
              <span style={styles.mobileAuthDividerLine} />
            </div>

            <div style={styles.mobileSocialGrid}>
              <button
                type="button"
                className="hover-button"
                onClick={() => void authLoginWithGoogle()}
                style={styles.mobileGoogleButton}
              >
                <span style={styles.btnInner}>
                  <span style={styles.googleMark}>
                    <span style={{ color: "#4285F4" }}>G</span>
                  </span>
                  Google
                </span>
              </button>
              <button
                type="button"
                className="hover-button"
                onClick={() => void authLoginWithFacebook()}
                style={{ ...styles.mobileGoogleButton, ...styles.mobileFacebookButton }}
              >
                <span style={styles.btnInner}>
                  <span style={styles.facebookMark}>f</span>
                  Facebook
                </span>
              </button>
            </div>
          </div>

          {msg ? <div style={{ ...styles.msg, marginTop: 14 }}>{msg}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.loginWrap, ...themeVars }} className="login-wrap">
      <div style={styles.loginShell} className="login-shell">
        <div style={styles.loginCard} className="login-card">
          <div style={styles.loginLogoWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/odedimi-logo.svg" alt="Ödedi mi" style={styles.loginLogo} />
          </div>
          <div style={styles.loginCardTitle} className="login-card-title">
            {authTitle}
          </div>

          <div style={styles.loginSocialGrid}>
            <button
              type="button"
              className="hover-button"
              onClick={() => void authLoginWithGoogle()}
              style={styles.loginGoogleWideButton}
            >
              <span style={styles.btnInner}>
                <span style={styles.googleMark}>
                  <span style={{ color: "#4285F4" }}>G</span>
                </span>
                Google
              </span>
            </button>
            <button
              type="button"
              className="hover-button"
              onClick={() => void authLoginWithFacebook()}
              style={{ ...styles.loginGoogleWideButton, ...styles.loginFacebookWideButton }}
            >
              <span style={styles.btnInner}>
                <span style={styles.facebookMark}>f</span>
                Facebook
              </span>
            </button>
          </div>

          <div style={styles.loginDividerText}>
            <span style={styles.loginDividerTextLine} />
            <span>veya</span>
            <span style={styles.loginDividerTextLine} />
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
              onClick={() => void (signupMode ? authSignUp() : authLogin())}
              style={styles.loginPrimaryAction}
              type="button"
            >
              <span style={styles.btnInner}>
                <Mail size={16} />
                {primaryLabel}
              </span>
            </button>
          </div>

          <div style={styles.loginSignupLine}>
            <span>{signupMode ? "Zaten hesabın var mı?" : "Hesabın yok mu?"}</span>
            <button
              type="button"
              className="hover-button"
              onClick={() => setSignupMode((prev) => !prev)}
              style={styles.switchAuthLink}
            >
              {signupMode ? "Giriş Yap" : "Hesap Oluştur"}
            </button>
          </div>

          {msg ? <div style={{ ...styles.msg, marginTop: 14 }}>{msg}</div> : null}
        </div>

        {!isMobileViewport ? (
          <div style={styles.loginShowcase} className="login-showcase">
            <div style={styles.loginSeoIntro}>
              <div style={styles.badge}>Freelance ödeme takip paneli</div>
              <h1 style={styles.loginHeadline}>Projelerinin ödenip ödenmediğini tek ekrandan takip et.</h1>
              <p style={styles.loginCopy}>
                Ödedimi; freelance çalışanların proje, fatura ve tahsilat durumlarını düzenli
                görmesi için tasarlanmış sade ve mobil uyumlu bir ödeme takip panelidir.
              </p>
              <div style={styles.loginSeoLinks}>
                <a href="/freelance-odeme-takibi" style={styles.loginSeoLink}>
                  Freelance ödeme takibi
                </a>
                <a href="/fatura-takip-programi" style={styles.loginSeoLink}>
                  Fatura takip programı
                </a>
                <a href="/tahsilat-takip-paneli" style={styles.loginSeoLink}>
                  Tahsilat takip paneli
                </a>
              </div>
            </div>
            <div style={styles.loginIllustrationGrid}>
              <div style={{ ...styles.loginIllustrationTile, ...styles.loginChartTile }}>
                <span style={{ ...styles.loginBar, height: 112, background: "#93E0B4" }} />
                <span style={{ ...styles.loginBar, height: 82, background: "#BFDBFE" }} />
                <span style={{ ...styles.loginBar, height: 58, background: "#C7F29B" }} />
                <div style={styles.loginTrendLine} />
              </div>

              <div style={{ ...styles.loginIllustrationTile, ...styles.loginInvoiceTile }}>
                <div style={styles.loginFolderShape} />
                <div style={styles.loginPaperShape}>
                  <span style={styles.loginPaperLine} />
                  <span style={styles.loginPaperLine} />
                  <span style={styles.loginPaperLineShort} />
                </div>
                <div style={styles.loginCursorShape} />
              </div>

              <div style={{ ...styles.loginIllustrationTile, ...styles.loginCoinTile }}>
                <div style={styles.loginCoinShadow} />
                <div style={styles.loginCoinMain}>₺</div>
                <div style={styles.loginCoinSmall}>₺</div>
              </div>

              <div style={{ ...styles.loginIllustrationTile, ...styles.loginWalletTile }}>
                <div style={styles.loginWalletShape}>
                  <span style={styles.loginWalletSlot} />
                  <span style={styles.loginWalletLine} />
                  <span style={styles.loginWalletLineShort} />
                </div>
              </div>

              <div style={{ ...styles.loginIllustrationTile, ...styles.loginGraphTile }}>
                <div style={styles.loginCardStackBack} />
                <div style={styles.loginCardStackFront}>
                  <span style={styles.loginCardChip} />
                  <span style={styles.loginCardNumberLine} />
                  <span style={styles.loginCardNumberShort} />
                </div>
                <div style={styles.loginReceiptMini}>
                  <span style={styles.loginReceiptLine} />
                  <span style={styles.loginReceiptLine} />
                  <span style={styles.loginReceiptTotal}>₺</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
              <div style={styles.settingsEmail}>{authEmail || "?"}</div>
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
              <div style={styles.mobileProjectHeadMain}>
                <div style={styles.mobileProjectTitle}>{row.proje || "?"}</div>
                <div style={styles.mobileProjectMetaRow}>
                  <div
                    style={styles.mobileProjectMeta}
                    className="money-value"
                    data-private-value="true"
                    data-mask="₺0"
                  >
                    {row.tutar ? tl(Number(row.tutar)) : "—"}
                  </div>
                  <div style={styles.mobileProjectMetaMuted}>
                    {shortDate(row.fatura_tarihi)}
                  </div>
                  {row.kdvli ? <div style={styles.mobileProjectMetaMuted}>+ %20 KDV</div> : null}
                  {row.gvkli ? <div style={styles.mobileProjectMetaMuted}>- %15 GVK</div> : null}
                  {invoices.length ? (
                    <div style={styles.mobileProjectMetaMuted}>{invoices.length} fatura</div>
                  ) : null}
                </div>
              </div>
              <button
                className="status-button"
                data-status={row.odendi ? "paid" : row.fatura_kesildi ? "invoiced" : "waiting"}
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
                <span className="status-label">{durum.text}</span>
              </button>
            </div>

            <div style={styles.mobileProjectSubMeta}>
              <span>Güncelleme: {shortDateTime(meta?.updatedAt || null)}</span>
              {meta?.createdAt ? (
                <span>Oluşturma: {shortDateTime(meta.createdAt)}</span>
              ) : null}
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
              <button
                className="hover-button"
                type="button"
                onClick={() => editAc(row)}
                style={styles.mobileProjectActionBtn}
              >
                Düzenle
              </button>
              <button
                className="hover-button"
                type="button"
                onClick={() => openInvoicePicker(row.id)}
                style={styles.mobileProjectActionBtn}
                disabled={uploadingInvoiceId === row.id}
              >
                Fatura
              </button>
              <button
                className="hover-button"
                type="button"
                onClick={() => void kayitSil(row.id)}
                style={styles.mobileProjectDeleteBtn}
              >
                Sil
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}



