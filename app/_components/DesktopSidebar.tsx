"use client";

import { Archive, LayoutDashboard, Plus, Settings2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { TabMenu, TabMeta, ViewMode } from "../page.shared";

type DesktopSidebarProps = {
  styles: Record<string, CSSProperties>;
  authEmail: string | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setSelectedIds: (ids: number[]) => void;
  yeniProjeOlustur: () => void;
  gorunenSekmeler: string[];
  tabMeta: Record<string, TabMeta>;
  aktifSekme: string;
  openProjectTab: (tabName: string) => void;
  setTabMenu: (menu: TabMenu) => void;
  showArchivedTabs: boolean;
  setShowArchivedTabs: (updater: (prev: boolean) => boolean) => void;
};

export function DesktopSidebar({
  styles,
  authEmail,
  viewMode,
  setViewMode,
  setSelectedIds,
  yeniProjeOlustur,
  gorunenSekmeler,
  tabMeta,
  aktifSekme,
  openProjectTab,
  setTabMenu,
  showArchivedTabs,
  setShowArchivedTabs,
}: DesktopSidebarProps) {
  return (
    <aside style={styles.sidebar} className="app-sidebar">
      <div>
        <div style={styles.sidebarTitle}>Panel</div>
        <div style={styles.sidebarSub}>{authEmail ? authEmail : "Tahsilat paneli"}</div>
      </div>

      <div style={styles.sidebarTabs} className="sidebar-tabs">
        <button
          className="sidebar-item"
          onClick={() => {
            setViewMode("home");
            setSelectedIds([]);
          }}
          style={viewMode === "home" ? styles.activeTab : styles.tab}
        >
          <span style={styles.sidebarTabInner}>
            <LayoutDashboard size={16} />
            Ana Sayfa
          </span>
        </button>

        <button
          className="sidebar-item hover-button"
          onClick={yeniProjeOlustur}
          style={styles.sidebarIconOnlyBtn}
          title="Yeni Proje"
          aria-label="Yeni Proje"
        >
          <span style={styles.sidebarIconOnlyInner}>
            <Plus size={16} />
          </span>
        </button>

        {gorunenSekmeler.map((tab) => {
          const meta = tabMeta[tab] || { color: "var(--blue)" };

          return (
            <button
              key={tab}
              className="sidebar-item"
              onClick={() => openProjectTab(tab)}
              onContextMenu={(e) => {
                e.preventDefault();
                setTabMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  tabName: tab,
                  mode: "menu",
                });
              }}
              style={viewMode === "project" && aktifSekme === tab ? styles.activeTab : styles.tab}
              title="Sağ tık: sekme seçenekleri"
            >
              <span style={styles.sidebarTabInner}>
                <span
                  style={{
                    ...styles.tabColorDot,
                    background: meta.color,
                  }}
                />
                <span>{tab}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div style={styles.sidebarBottom} data-sidebar-bottom="true" className="sidebar-bottom">
        <button
          className="hover-button"
          onClick={() => setViewMode("settings")}
          style={viewMode === "settings" ? styles.activeTab : styles.tab}
        >
          <span style={styles.sidebarTabInner}>
            <Settings2 size={16} />
            Hesap Ayarları
          </span>
        </button>
        <button
          className="hover-button"
          onClick={() => setShowArchivedTabs((p) => !p)}
          style={styles.secondaryBtn}
        >
          <span style={styles.btnInner}>
            <Archive size={16} />
            {showArchivedTabs ? "Aktifleri Göster" : "Arşivleri Göster"}
          </span>
        </button>
      </div>
    </aside>
  );
}
