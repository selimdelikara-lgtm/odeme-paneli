"use client";

import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  LogOut,
  Moon,
  Receipt,
  Search,
  SunMedium,
  Wallet,
} from "lucide-react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import type { HomeProjectStat } from "../page.selectors";
import type { TabMeta, ThemeMode, ViewMode } from "../page.shared";
import { tl } from "../page.helpers";
import { Stat } from "./PageBits";

type DashboardHeroProps = {
  styles: Record<string, CSSProperties>;
  isMobileViewport: boolean;
  viewMode: ViewMode;
  theme: ThemeMode;
  toplam: number;
  odenen: number;
  kalan: number;
  exportMenuRef: RefObject<HTMLDivElement | null>;
  exportMenuOpen: boolean;
  onToggleExportMenu: () => void;
  onExportWord: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onToggleSearch: () => void;
  onTogglePrivacy: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  privacyMode: boolean;
};

export function DashboardHero({
  styles,
  isMobileViewport,
  viewMode,
  theme,
  toplam,
  odenen,
  kalan,
  exportMenuRef,
  exportMenuOpen,
  onToggleExportMenu,
  onExportWord,
  onExportExcel,
  onExportPdf,
  onToggleSearch,
  onTogglePrivacy,
  onToggleTheme,
  onSignOut,
  privacyMode,
}: DashboardHeroProps) {
  return (
    <div style={styles.heroCard} className="hero-card">
      <div style={styles.heroTopRow} className="hero-top-row">
        <div>
          <div style={styles.heroLabel}>{viewMode === "home" ? "TOPLAM" : "GENEL TOPLAM"}</div>
          <div
            style={styles.heroValue}
            className="hero-value money-value"
            data-private-value="true"
            data-mask="₺0"
          >
            {tl(toplam)}
          </div>
        </div>
        {isMobileViewport ? (
          <div style={styles.heroMobileActions} className="no-print">
            <button
              type="button"
              className="hover-button"
              style={styles.heroMobileIconBtn}
              onClick={onToggleSearch}
              aria-label="Ara"
              title="Ara"
            >
              <Search size={15} />
            </button>

            <button
              type="button"
              className="hover-button"
              style={styles.heroMobileIconBtn}
              onClick={onTogglePrivacy}
              aria-label={privacyMode ? "Rakamları göster" : "Rakamları gizle"}
              title={privacyMode ? "Rakamları göster" : "Rakamları gizle"}
            >
              {privacyMode ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>

            <button
              type="button"
              className="hover-button"
              style={styles.heroMobileIconBtn}
              onClick={onToggleTheme}
              aria-label={theme === "light" ? "Karanlık tema" : "Açık tema"}
              title={theme === "light" ? "Karanlık tema" : "Açık tema"}
            >
              {theme === "light" ? <Moon size={15} /> : <SunMedium size={15} />}
            </button>

            <button
              type="button"
              className="hover-button"
              style={styles.heroMobileIconBtn}
              onClick={onSignOut}
              aria-label="Çıkış"
              title="Çıkış"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : null}
        <div
          style={styles.heroExportWrap}
          className="hero-actions no-print"
          ref={exportMenuRef}
        >
          <button
            type="button"
            onClick={onToggleExportMenu}
            style={styles.heroExportToggle}
            className="hero-export-toggle"
          >
            <span style={styles.heroExportToggleInner}>
              <Download size={14} />
              <span className="hero-export-label">Dışa Aktar</span>
              <ChevronDown size={14} />
            </span>
          </button>

          {exportMenuOpen ? (
            <div style={styles.heroExportMenu} className="export-menu">
              <button type="button" onClick={onExportWord} style={styles.heroExportMenuItem}>
                <span
                  style={{
                    ...styles.heroExportMenuIcon,
                    ...styles.heroExportMenuIconWord,
                  }}
                >
                  <FileText size={14} />
                </span>
                <span>Word</span>
              </button>

              <button type="button" onClick={onExportExcel} style={styles.heroExportMenuItem}>
                <span
                  style={{
                    ...styles.heroExportMenuIcon,
                    ...styles.heroExportMenuIconExcel,
                  }}
                >
                  <Download size={14} />
                </span>
                <span>Excel</span>
              </button>

              <button type="button" onClick={onExportPdf} style={styles.heroExportMenuItem}>
                <span
                  style={{
                    ...styles.heroExportMenuIcon,
                    ...styles.heroExportMenuIconPdf,
                  }}
                >
                  <FileText size={14} />
                </span>
                <span>PDF</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div style={styles.heroSubRow}>
        <div>
          <div style={styles.heroSubTitle}>ÖDENEN</div>
          <div
            style={styles.heroSubValue}
            className="money-value"
            data-private-value="true"
            data-mask="₺0"
          >
            {tl(odenen)}
          </div>
        </div>

        <div style={styles.heroDivider} />

        <div>
          <div style={styles.heroSubTitle}>KALAN</div>
          <div
            style={styles.heroSubValue}
            className="money-value"
            data-private-value="true"
            data-mask="₺0"
          >
            {tl(kalan)}
          </div>
        </div>
      </div>
    </div>
  );
}

type SummaryStatsGridProps = {
  styles: Record<string, CSSProperties>;
  viewMode: ViewMode;
  filteredHomeRowsLength: number;
  filteredActiveRowsLength: number;
  homeSummary: {
    tumOdeme: number;
    tumFatura: number;
    toplam: number;
  };
  projectSummary: {
    odemesiAlinanAdet: number;
    faturasiKesilenAdet: number;
    kalan: number;
  };
  activeTabMeta: TabMeta;
  palette: {
    blue: string;
    teal: string;
    amber: string;
    red: string;
  };
};

export function SummaryStatsGrid({
  styles,
  viewMode,
  filteredHomeRowsLength,
  filteredActiveRowsLength,
  homeSummary,
  projectSummary,
  activeTabMeta,
  palette,
}: SummaryStatsGridProps) {
  const items: Array<{
    title: string;
    value: string;
    icon: ReactNode;
    iconWrapStyle?: CSSProperties;
    privateValue?: boolean;
  }> =
    viewMode === "home"
      ? [
          {
            title: "Toplam Kayıt",
            value: String(filteredHomeRowsLength),
            icon: <FolderKanban size={16} color={palette.blue} />,
            iconWrapStyle: styles.statIconBlue,
          },
          {
            title: "Ödeme Alındı",
            value: String(homeSummary.tumOdeme),
            icon: <CheckCircle2 size={16} color={palette.teal} />,
            iconWrapStyle: styles.statIconTeal,
          },
          {
            title: "Fatura Kesildi",
            value: String(homeSummary.tumFatura),
            icon: <Receipt size={16} color={palette.amber} />,
            iconWrapStyle: styles.statIconAmber,
          },
          {
            title: "Toplam Tutar",
            value: tl(homeSummary.toplam),
            icon: <Wallet size={16} color={palette.blue} />,
            iconWrapStyle: styles.statIconBlue,
            privateValue: true,
          },
        ]
      : [
          {
            title: "Toplam Kayıt",
            value: String(filteredActiveRowsLength),
            icon: <FolderKanban size={16} color={activeTabMeta.color} />,
            iconWrapStyle: styles.statIconBlue,
          },
          {
            title: "Ödeme Alındı",
            value: String(projectSummary.odemesiAlinanAdet),
            icon: <CheckCircle2 size={16} color={palette.teal} />,
            iconWrapStyle: styles.statIconTeal,
          },
          {
            title: "Fatura Kesildi",
            value: String(projectSummary.faturasiKesilenAdet),
            icon: <Receipt size={16} color={palette.amber} />,
            iconWrapStyle: styles.statIconAmber,
          },
          {
            title: "Kalan Tahsilat",
            value: tl(projectSummary.kalan),
            icon: <Clock3 size={16} color={palette.red} />,
            iconWrapStyle: styles.statIconRed,
            privateValue: true,
          },
        ];

  return (
    <div style={styles.statsGrid} className="stats-grid">
      {items.map((item) => (
        <Stat
          key={item.title}
          styles={styles}
          title={item.title}
          value={item.value}
          icon={item.icon}
          iconWrapStyle={item.iconWrapStyle}
          privateValue={item.privateValue}
        />
      ))}
    </div>
  );
}

type SummaryQuickPanelsProps = {
  styles: Record<string, CSSProperties>;
  viewMode: ViewMode;
  homeProjectStats: HomeProjectStat[];
  filteredHomeRowsLength: number;
  filteredActiveRowsLength: number;
  tumOdeme: number;
  tumFatura: number;
  tumOdenenTutar: number;
  tumKalanTutar: number;
  tahsilatYuzdesiGenel: number;
  toplam: number;
  tahsilatYuzdesiAktif: number;
  odenen: number;
  kalan: number;
  odemesiAlinanAdet: number;
  faturasiKesilenAdet: number;
  selectedVisibleIdsLength: number;
  aktifTabMeta: TabMeta;
};

export function SummaryQuickPanels({
  styles,
  viewMode,
  homeProjectStats,
  filteredHomeRowsLength,
  filteredActiveRowsLength,
  tumOdeme,
  tumFatura,
  tumOdenenTutar,
  tumKalanTutar,
  tahsilatYuzdesiGenel,
  toplam,
  tahsilatYuzdesiAktif,
  odenen,
  kalan,
  odemesiAlinanAdet,
  faturasiKesilenAdet,
  selectedVisibleIdsLength,
  aktifTabMeta,
}: SummaryQuickPanelsProps) {
  const bekleyenHome = Math.max(filteredHomeRowsLength - tumOdeme, 0);
  const bekleyenProject = Math.max(filteredActiveRowsLength - odemesiAlinanAdet, 0);

  if (viewMode === "home") {
    return (
      <div style={styles.quickGrid} className="quick-grid">
        <div style={{ ...styles.quickCard, ...styles.projectSummaryCard }}>
          <div style={styles.quickTitle} className="quick-title">
            Tahsilat Özeti
          </div>
          <div
            style={styles.projectSummaryAmount}
            className="quick-amount money-value"
            data-private-value="true"
            data-mask="₺0"
          >
            {tl(tumOdenenTutar)}
          </div>
          <div style={styles.quickMuted} className="quick-muted">
            Filtreye göre tahsil edilen tutar
          </div>

          <div style={styles.progressWrap}>
            <div
              style={{
                ...styles.progressBar,
                width: `${tahsilatYuzdesiGenel}%`,
              }}
            />
          </div>

          <div style={{ ...styles.quickFooterRow, ...styles.projectSummaryRow }}>
            <span>Tahsilat Oranı</span>
            <strong>%{tahsilatYuzdesiGenel}</strong>
          </div>

          <div style={{ ...styles.quickFooterRow, ...styles.projectSummaryRow }}>
            <span>Kalan Tutar</span>
            <strong className="money-value" data-private-value="true" data-mask="₺0">
              {tl(tumKalanTutar)}
            </strong>
          </div>
        </div>

        <div style={{ ...styles.quickCard, ...styles.projectSummaryCard }}>
          <div style={styles.quickTitle} className="quick-title">
            Hızlı Durum
          </div>
          <div style={styles.projectInfoList}>
            <div style={styles.projectInfoRow}>
              <span>Proje</span>
              <strong>{homeProjectStats.length}</strong>
            </div>
            <div style={styles.projectInfoRow}>
              <span>Ödeme</span>
              <strong>{tumOdeme}</strong>
            </div>
            <div style={styles.projectInfoRow}>
              <span>Fatura</span>
              <strong>{tumFatura}</strong>
            </div>
            <div style={styles.projectInfoRow}>
              <span>Bekleyen</span>
              <strong>{bekleyenHome}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.quickGrid} className="quick-grid">
      <div style={{ ...styles.quickCard, ...styles.projectSummaryCard }}>
        <div style={styles.quickTitle} className="quick-title">
          Sekme Özeti
        </div>
        <div
          style={styles.projectSummaryAmount}
          className="quick-amount money-value"
          data-private-value="true"
          data-mask="₺0"
        >
          {tl(toplam)}
        </div>
        <div style={styles.quickMuted} className="quick-muted">
          Bu sekmenin toplamı
        </div>

        <div style={styles.progressWrap}>
          <div
            style={{
              ...styles.progressBar,
              width: `${tahsilatYuzdesiAktif}%`,
              background: `linear-gradient(90deg, ${aktifTabMeta.color}, var(--teal))`,
            }}
          />
        </div>

        <div style={{ ...styles.quickFooterRow, ...styles.projectSummaryRow }}>
          <span>Tahsilat Oranı</span>
          <strong>%{tahsilatYuzdesiAktif}</strong>
        </div>

        <div style={{ ...styles.quickFooterRow, ...styles.projectSummaryRow }}>
          <span>Ödenen</span>
          <strong className="money-value" data-private-value="true" data-mask="₺0">
            {tl(odenen)}
          </strong>
        </div>

        <div style={{ ...styles.quickFooterRow, ...styles.projectSummaryRow }}>
          <span>Kalan</span>
          <strong className="money-value" data-private-value="true" data-mask="₺0">
            {tl(kalan)}
          </strong>
        </div>
      </div>

      <div style={{ ...styles.quickCard, ...styles.projectSummaryCard }}>
        <div style={styles.quickTitle} className="quick-title">
          Hızlı Bilgi
        </div>
        <div style={styles.projectInfoList}>
          <div style={styles.projectInfoRow}>
            <span>Ödeme Alınan</span>
            <strong>{odemesiAlinanAdet}</strong>
          </div>
          <div style={styles.projectInfoRow}>
            <span>Fatura Kesilen</span>
            <strong>{faturasiKesilenAdet}</strong>
          </div>
          <div style={styles.projectInfoRow}>
            <span>Bekleyen</span>
            <strong>{bekleyenProject}</strong>
          </div>
          <div style={styles.projectInfoRow}>
            <span>Seçili Kayıt</span>
            <strong>{selectedVisibleIdsLength}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
