"use client";

import { Archive, FolderKanban, LayoutDashboard, Plus, Search, Settings2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { TabMeta, ViewMode } from "../page.shared";

type MobileNavigationProps = {
  styles: Record<string, CSSProperties>;
  showMobileProjects: boolean;
  setShowMobileProjects: (value: boolean) => void;
  showArchivedTabs: boolean;
  setShowArchivedTabs: (updater: (prev: boolean) => boolean) => void;
  gorunenSekmeler: string[];
  tabMeta: Record<string, TabMeta>;
  viewMode: ViewMode;
  aktifSekme: string;
  openProjectTab: (tabName: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedIds: (value: number[]) => void;
  yeniProjeOlustur: () => void;
  showMobileSearch: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  mutedColor: string;
};

export function MobileNavigation({
  styles,
  showMobileProjects,
  setShowMobileProjects,
  showArchivedTabs,
  setShowArchivedTabs,
  gorunenSekmeler,
  tabMeta,
  viewMode,
  aktifSekme,
  openProjectTab,
  setViewMode,
  setSelectedIds,
  yeniProjeOlustur,
  showMobileSearch,
  searchTerm,
  setSearchTerm,
  mutedColor,
}: MobileNavigationProps) {
  return (
    <>
      <div
        className="mobile-projects-sheet"
        style={{
          ...styles.mobileProjectsBackdrop,
          opacity: showMobileProjects ? 1 : 0,
          pointerEvents: showMobileProjects ? "auto" : "none",
        }}
        onClick={() => setShowMobileProjects(false)}
      >
        <div
          style={{
            ...styles.mobileProjectsSheet,
            transform: showMobileProjects ? "translateY(0)" : "translateY(24px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.mobileProjectsSheetHeader}>
            <strong>Projeler</strong>
            <button
              type="button"
              className="hover-button"
              style={styles.mobileProjectsSheetAction}
              onClick={() => setShowArchivedTabs((p) => !p)}
            >
              {showArchivedTabs ? "Aktifler" : "Arşiv"}
            </button>
          </div>

          <div style={styles.mobileProjectsList}>
            {gorunenSekmeler.map((tab) => {
              const meta = tabMeta[tab] || { color: "var(--blue)" };
              const active = viewMode === "project" && aktifSekme === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  className="hover-button"
                  style={active ? styles.mobileProjectItemActive : styles.mobileProjectItem}
                  onClick={() => {
                    openProjectTab(tab);
                    setShowMobileProjects(false);
                  }}
                >
                  <span
                    style={{
                      ...styles.tabColorDot,
                      background: meta.color,
                    }}
                  />
                  <span>{tab}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {viewMode !== "settings" && showMobileSearch ? (
        <div style={styles.mobileSearchPanel}>
          <div style={styles.mobileSearchField}>
            <Search size={15} color={mutedColor} />
            <input
              className="soft-input"
              placeholder="Ara"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIds([]);
              }}
              style={styles.topSearchInput}
              autoFocus
            />
          </div>
        </div>
      ) : null}

      <div style={styles.mobileBottomNav} className="mobile-bottom-nav no-print">
        <button
          type="button"
          className="hover-button"
          style={viewMode === "home" ? styles.mobileNavItemActive : styles.mobileNavItem}
          onClick={() => {
            setViewMode("home");
            setSelectedIds([]);
            setShowMobileProjects(false);
          }}
        >
          <LayoutDashboard size={15} />
          <span>Ana Sayfa</span>
        </button>

        <button
          type="button"
          className="hover-button"
          style={viewMode === "project" ? styles.mobileNavItemActive : styles.mobileNavItem}
          onClick={() => setShowMobileProjects(true)}
        >
          <FolderKanban size={15} />
          <span>Projeler</span>
        </button>

        <button
          type="button"
          className="hover-button"
          style={styles.mobileNavPlus}
          onClick={yeniProjeOlustur}
          aria-label="Yeni Proje"
          title="Yeni Proje"
        >
          <Plus size={22} />
        </button>

        <button
          type="button"
          className="hover-button"
          style={showArchivedTabs ? styles.mobileNavItemActive : styles.mobileNavItem}
          onClick={() => {
            setShowArchivedTabs((prev) => !prev);
            setShowMobileProjects(false);
          }}
        >
          <Archive size={15} />
          <span>Arşiv</span>
        </button>

        <button
          type="button"
          className="hover-button"
          style={viewMode === "settings" ? styles.mobileNavItemActive : styles.mobileNavItem}
          onClick={() => {
            setViewMode("settings");
            setShowMobileProjects(false);
          }}
        >
          <Settings2 size={15} />
          <span>Ayarlar</span>
        </button>
      </div>
    </>
  );
}
