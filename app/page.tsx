"use client";

import {
  Archive,
  CheckCircle2,
  CheckSquare,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Square,
  SunMedium,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import {
  DARK,
  DEFAULT_COLORS,
  HOME_PROJECT_COLUMN_ORDER_DEFAULT,
  INVOICE_FILE_ACCEPT,
  LIGHT,
  MAX_INVOICE_FILE_SIZE_BYTES,
  MAX_INVOICE_FILE_SIZE_MB,
  PROJECT_COLUMN_ORDER_DEFAULT,
  type DraftState,
  type DropPosition,
  type HomeProjectColumnKey,
  type InvoiceAttachment,
  type ActivityItem,
  type Odeme,
  type PdfWindow,
  type ProjectColumnKey,
  type RowMeta,
  type SortDirection,
  type SortKey,
  type StatusFilter,
  type TabMenu,
  type TabMeta,
  type ThemeMode,
  type ViewMode,
} from "./page.shared";
import {
  faturaEkleriTable,
  isHomeProjectColumnKey,
  isAllowedInvoiceFile,
  isProjectColumnKey,
  loadScript,
  odemelerTable,
  readStoredState,
  readStoredTheme,
  sanitizeFileName,
  shortDate,
  shortDateTime,
  tl,
} from "./page.helpers";
import {
  buildHomeProjectStats,
  filterRows,
  sortProjectRows,
  summarizeRows,
} from "./page.selectors";
import {
  browserSupabase as supabase,
  setAuthStoragePreference,
} from "@/lib/supabase";
import {
  AnimatedMoney,
  AuthScreen,
  EmptyStateCard,
  MobileProjectCards,
  SettingsContent,
} from "./_components/PageBits";
import { DesktopSidebar } from "./_components/DesktopSidebar";
import {
  DashboardHero,
  SummaryQuickPanels,
  SummaryStatsGrid,
} from "./_components/DashboardOverview";
import { MobileNavigation } from "./_components/MobileNavigation";
import type {
  FaturaEkiInsert,
  OdemeInsert,
  OdemeUpdate,
} from "@/lib/database.types";

const PROJECT_MODAL_COLORS = [
  DEFAULT_COLORS[0],
  DEFAULT_COLORS[1],
  DEFAULT_COLORS[2],
  DEFAULT_COLORS[3],
  DEFAULT_COLORS[4],
  DEFAULT_COLORS[5],
  DEFAULT_COLORS[8],
  DEFAULT_COLORS[10],
  DEFAULT_COLORS[15],
  DEFAULT_COLORS[16],
];

type TaxMode = "none" | "kdv" | "gvk" | "kdv_gvk";

const taxModeFromFlags = (hasKdv: boolean, hasGvk: boolean): TaxMode => {
  if (hasKdv && hasGvk) return "kdv_gvk";
  if (hasKdv) return "kdv";
  if (hasGvk) return "gvk";
  return "none";
};

const taxFlagsFromMode = (mode: string) => ({
  kdvli: mode === "kdv" || mode === "kdv_gvk",
  gvkli: mode === "gvk" || mode === "kdv_gvk",
});

export default function Page() {
  const [data, setData] = useState<Odeme[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [aktifSekme, setAktifSekme] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authProviders, setAuthProviders] = useState<string[]>([]);
  const [rememberMe, setRememberMe] = useState(true);
  const [signupMode, setSignupMode] = useState(false);

  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);
  const [privacyMode, setPrivacyMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("odeme-privacy-blur-v1") === "true";
  });

  const [proje, setProje] = useState("");
  const [tutar, setTutar] = useState("");
  const [tarih, setTarih] = useState("");
  const [kdvli, setKdvli] = useState(false);
  const [gvkli, setGvkli] = useState(false);
  const [faturaKesildi, setFaturaKesildi] = useState(false);
  const [odemeAlindi, setOdemeAlindi] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [inlineFocusColumn, setInlineFocusColumn] = useState<ProjectColumnKey | null>(null);

  const [tabMenu, setTabMenu] = useState<TabMenu>({
    visible: false,
    x: 0,
    y: 0,
    tabName: "",
    mode: "menu",
  });

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>("before");
  const [draggedColumn, setDraggedColumn] = useState<ProjectColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ProjectColumnKey | null>(null);
  const [columnDropPosition, setColumnDropPosition] = useState<DropPosition>("before");
  const [draggedHomeColumn, setDraggedHomeColumn] = useState<HomeProjectColumnKey | null>(null);
  const [dragOverHomeColumn, setDragOverHomeColumn] = useState<HomeProjectColumnKey | null>(null);
  const [homeColumnDropPosition, setHomeColumnDropPosition] = useState<DropPosition>("before");
  const [sortKey, setSortKey] = useState<SortKey>("manual");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter] = useState<StatusFilter>("all");
  const [dateFrom] = useState("");
  const [dateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Odeme[] | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const [rowMeta, setRowMeta] = useState<Record<number, RowMeta>>(() =>
    readStoredState<Record<number, RowMeta>>("odeme-row-meta-v1", {})
  );
  const [tabMeta, setTabMeta] = useState<Record<string, TabMeta>>(() =>
    readStoredState<Record<string, TabMeta>>("odeme-tab-meta-v1", {})
  );
  const [drafts, setDrafts] = useState<Record<string, DraftState>>(() =>
    readStoredState<Record<string, DraftState>>("odeme-drafts-v1", {})
  );
  const [archivedTabs, setArchivedTabs] = useState<string[]>(() =>
    readStoredState<string[]>("odeme-archived-tabs-v1", [])
  );
  const [showArchivedTabs, setShowArchivedTabs] = useState(false);
  const [showMobileProjects, setShowMobileProjects] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [projectColumnOrder, setProjectColumnOrder] = useState<ProjectColumnKey[]>(() => {
    const stored = readStoredState<ProjectColumnKey[]>(
      "odeme-project-columns-v1",
      PROJECT_COLUMN_ORDER_DEFAULT
    );
    return PROJECT_COLUMN_ORDER_DEFAULT.every((key) => stored.includes(key))
      ? stored
      : PROJECT_COLUMN_ORDER_DEFAULT;
  });
  const [homeProjectColumnOrder, setHomeProjectColumnOrder] = useState<HomeProjectColumnKey[]>(() => {
    const stored = readStoredState<HomeProjectColumnKey[]>(
      "odeme-home-project-columns-v1",
      HOME_PROJECT_COLUMN_ORDER_DEFAULT
    );
    return HOME_PROJECT_COLUMN_ORDER_DEFAULT.every((key) => stored.includes(key))
      ? stored
      : HOME_PROJECT_COLUMN_ORDER_DEFAULT;
  });
  const [invoiceMap, setInvoiceMap] = useState<Record<number, InvoiceAttachment[]>>({});
  const [invoiceTargetId, setInvoiceTargetId] = useState<number | null>(null);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<number | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState<string>(DEFAULT_COLORS[0]);
  const [newProjectFirstItem, setNewProjectFirstItem] = useState("");
  const [newProjectAmount, setNewProjectAmount] = useState("");
  const [newProjectDate, setNewProjectDate] = useState("");
  const [newProjectKdvli, setNewProjectKdvli] = useState(false);
  const [newProjectGvkli, setNewProjectGvkli] = useState(false);
  const [newProjectInvoice, setNewProjectInvoice] = useState(false);
  const [newProjectPaid, setNewProjectPaid] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState<string | null>(null);
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsPasswordRepeat, setSettingsPasswordRepeat] = useState("");
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);

  const exportRef = useRef<HTMLElement | null>(null);
  const projectPdfRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const initialLoadRef = useRef(false);
  const draggedColumnRef = useRef<ProjectColumnKey | null>(null);
  const draggedHomeColumnRef = useRef<HomeProjectColumnKey | null>(null);
  const inlineSaveInProgressRef = useRef(false);

  const palette = theme === "dark" ? DARK : LIGHT;

  const syncAuthProfile = (
    user: {
      email?: string | null;
      id?: string | null;
      user_metadata?: Record<string, unknown>;
      app_metadata?: Record<string, unknown>;
    } | null
  ) => {
    const metadata = (user?.user_metadata || {}) as Record<string, unknown>;
    const appMeta = (user?.app_metadata || {}) as Record<string, unknown>;
    const providers = Array.isArray(appMeta.providers)
      ? appMeta.providers.filter((item): item is string => typeof item === "string")
      : typeof appMeta.provider === "string"
        ? [appMeta.provider]
        : [];
    const displayName = typeof metadata.display_name === "string" ? metadata.display_name : "";
    const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

    setAuthEmail(user?.email || null);
    setAuthUserId(user?.id || null);
    setAuthProviders(providers);
    setSettingsName(displayName);
    setSettingsAvatarUrl(avatarUrl);
  };

  const applyDraftToForm = (draft: DraftState | undefined) => {
    setProje(draft?.proje ?? "");
    setTutar(draft?.tutar ?? "");
    setTarih(draft?.tarih ?? "");
    setKdvli(draft?.kdvli ?? false);
    setGvkli(draft?.gvkli ?? false);
    setFaturaKesildi(draft?.faturaKesildi ?? false);
    setOdemeAlindi(draft?.odemeAlindi ?? false);
  };

  const pushActivity = useCallback((title: string, detail: string) => {
    const item: ActivityItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      detail,
      createdAt: new Date().toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setActivityLog((prev) => [item, ...prev].slice(0, 30));

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) return;

      await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          detail,
          source: "client",
        }),
      });
    })();
  }, []);

  const openProjectTab = (tabName: string) => {
    setAktifSekme(tabName);
    setViewMode("project");
    if (editId === null) {
      applyDraftToForm(drafts[tabName]);
    }
    setSelectedIds([]);
  };

  const updateDraftField = (patch: Partial<DraftState>) => {
    if (!aktifSekme || editId !== null || viewMode !== "project") return;

    setDrafts((prev) => ({
      ...prev,
      [aktifSekme]: {
        ...prev[aktifSekme],
        proje,
        tutar,
        tarih,
        kdvli,
        gvkli,
        faturaKesildi,
        odemeAlindi,
        ...patch,
      },
    }));
  };

  const themeVars: CSSProperties = {
    ["--appBg" as string]: palette.appBg,
    ["--sidebarBg" as string]: palette.sidebarBg,
    ["--contentBg" as string]: palette.contentBg,
    ["--card" as string]: palette.card,
    ["--border" as string]: palette.border,
    ["--text" as string]: palette.text,
    ["--textSoft" as string]: palette.textSoft,
    ["--muted" as string]: palette.muted,
    ["--white" as string]: palette.white,
    ["--blue" as string]: palette.blue,
    ["--blueSoft" as string]: palette.blueSoft,
    ["--teal" as string]: palette.teal,
    ["--tealSoft" as string]: palette.tealSoft,
    ["--amber" as string]: palette.amber,
    ["--amberSoft" as string]: palette.amberSoft,
    ["--red" as string]: palette.red,
    ["--redSoft" as string]: palette.redSoft,
    ["--slateSoft" as string]: palette.slateSoft,
    ["--shadow" as string]: palette.shadow,
    ["--hero" as string]: palette.hero,
  };

  useEffect(() => {
    localStorage.setItem("odeme-theme-v1", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("odeme-privacy-blur-v1", String(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem("odeme-drafts-v1", JSON.stringify(drafts));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [drafts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem("odeme-row-meta-v1", JSON.stringify(rowMeta));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [rowMeta]);

  useEffect(() => {
    localStorage.setItem("odeme-tab-meta-v1", JSON.stringify(tabMeta));
  }, [tabMeta]);

  useEffect(() => {
    localStorage.setItem("odeme-archived-tabs-v1", JSON.stringify(archivedTabs));
  }, [archivedTabs]);

  useEffect(() => {
    localStorage.setItem(
      "odeme-project-columns-v1",
      JSON.stringify(projectColumnOrder)
    );
  }, [projectColumnOrder]);

  useEffect(() => {
    localStorage.setItem(
      "odeme-home-project-columns-v1",
      JSON.stringify(homeProjectColumnOrder)
    );
  }, [homeProjectColumnOrder]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncViewport = () => {
      setIsMobileViewport(window.innerWidth <= 820);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    initialLoadRef.current = false;
  }, [authUserId]);

  useEffect(() => {
    let cancelled = false;

    const loadAuditLog = async () => {
      if (!authUserId) {
        setActivityLog([]);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        setActivityLog([]);
        return;
      }

      const response = await fetch("/api/audit", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json().catch(() => ({}))) as {
        items?: ActivityItem[];
      };

      if (!response.ok || !Array.isArray(payload.items)) {
        return;
      }

      if (cancelled) return;
      setActivityLog(payload.items);
    };

    const timer = window.setTimeout(() => {
      void loadAuditLog();
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authUserId]);

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        syncAuthProfile(session.user);
      }
    };

    void run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        const nextPassword = window.prompt("Yeni şifreni gir");

        if (nextPassword && nextPassword.trim()) {
          void supabase.auth
            .updateUser({ password: nextPassword.trim() })
            .then(({ error }) => {
              if (error) {
                setMsg("Şifre güncellenemedi: " + error.message);
                return;
              }
              setMsg("Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.");
            });
        }
      }

      if (session?.user) {
        syncAuthProfile(session.user);
      } else {
        setAuthEmail(null);
        setAuthUserId(null);
        setAuthProviders([]);
        setSettingsName("");
        setSettingsAvatarUrl(null);
        setSettingsCurrentPassword("");
        setSettingsPassword("");
        setSettingsPasswordRepeat("");
        setData([]);
        setAktifSekme("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const yukle = useCallback(async () => {
    if (!authUserId) return;

    setLoading(true);

    const { data, error } = await odemelerTable()
      .select("*")
      .eq("user_id", authUserId)
      .order("grup", { ascending: true })
      .order("sira", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });

    if (error) {
      setMsg("Veriler alınamadı: " + error.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as Odeme[];
    setData(rows);

    if (!aktifSekme && rows.length) {
      const firstTab = rows[0].grup || "";
      setAktifSekme(firstTab);
      applyDraftToForm(drafts[firstTab]);
    }

    const now = new Date().toISOString();

    setRowMeta((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        if (!next[row.id]) {
          next[row.id] = { createdAt: now, updatedAt: now };
        }
      }
      return next;
    });

    setTabMeta((prev) => {
      const next = { ...prev };
      rows.forEach((row, index) => {
        const tab = row.grup || "";
        if (tab && !next[tab]) {
          next[tab] = {
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          };
        }
      });
      return next;
    });

    setLoading(false);
  }, [aktifSekme, authUserId, drafts]);

  useEffect(() => {
    if (!authUserId) return;
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const timer = window.setTimeout(() => {
      void yukle();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authUserId, yukle]);

  const rowIdsKey = useMemo(
    () => data.map((row) => row.id).filter((id) => id > 0).join(","),
    [data]
  );
  const rowIds = useMemo(
    () => (rowIdsKey ? rowIdsKey.split(",").map(Number) : []),
    [rowIdsKey]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!authUserId || !rowIds.length) {
        if (!cancelled) {
          setInvoiceMap({});
        }
        return;
      }

      const { data: rows, error } = await faturaEkleriTable()
        .select("*")
        .eq("user_id", authUserId)
        .in("odeme_id", rowIds)
        .order("uploaded_at", { ascending: false });

      if (cancelled || error) return;

      const nextMap: Record<number, InvoiceAttachment[]> = {};

      for (const item of (rows || []) as Array<Record<string, unknown>>) {
        const rowId = Number(item.odeme_id);
        if (!rowId) continue;

        if (!nextMap[rowId]) nextMap[rowId] = [];
        nextMap[rowId].push({
          id: Number(item.id),
          name: String(item.name || ""),
          path: String(item.path || ""),
          url: String(item.url || ""),
          uploadedAt: String(item.uploaded_at || ""),
        });
      }

      setInvoiceMap(nextMap);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [authUserId, rowIds]);

  useEffect(() => {
    const close = () => setTabMenu((p) => ({ ...p, visible: false }));
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const closeExportMenu = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (exportMenuRef.current?.contains(target)) return;
      setExportMenuOpen(false);
    };

    window.addEventListener("click", closeExportMenu);
    return () => window.removeEventListener("click", closeExportMenu);
  }, []);

  const sekmeler = useMemo(
    () => Array.from(new Set(data.map((i) => i.grup || "").filter(Boolean))),
    [data]
  );

  const gorunenSekmeler = useMemo(() => {
    return sekmeler.filter((tab) =>
      showArchivedTabs ? archivedTabs.includes(tab) : !archivedTabs.includes(tab)
    );
  }, [sekmeler, archivedTabs, showArchivedTabs]);

  const homeBaseRows = useMemo(() => {
    return data.filter((row) =>
      showArchivedTabs
        ? archivedTabs.includes(row.grup || "")
        : !archivedTabs.includes(row.grup || "")
    );
  }, [data, archivedTabs, showArchivedTabs]);

  const aktifKayitlar = useMemo(() => {
    const rows = data.filter((i) => (i.grup || "") === aktifSekme);
    return sortProjectRows(rows, sortKey, sortDirection);
  }, [data, aktifSekme, sortKey, sortDirection]);

  const filteredHomeRows = useMemo(
    () =>
      filterRows(homeBaseRows, {
        searchTerm: deferredSearchTerm,
        statusFilter,
        dateFrom,
        dateTo,
      }),
    [homeBaseRows, deferredSearchTerm, statusFilter, dateFrom, dateTo]
  );

  const filteredActiveKayitlar = useMemo(
    () =>
      filterRows(aktifKayitlar, {
        searchTerm: deferredSearchTerm,
        statusFilter,
        dateFrom,
        dateTo,
      }),
    [aktifKayitlar, deferredSearchTerm, statusFilter, dateFrom, dateTo]
  );

  const activeSummary = useMemo(
    () => summarizeRows(filteredActiveKayitlar),
    [filteredActiveKayitlar]
  );
  const homeSummary = useMemo(
    () => summarizeRows(filteredHomeRows),
    [filteredHomeRows]
  );

  const toplam = activeSummary.toplam;
  const odenen = activeSummary.odenen;
  const odemesiAlinanAdet = activeSummary.tumOdeme;
  const faturasiKesilenAdet = activeSummary.tumFatura;
  const kalan = activeSummary.kalan;
  const tahsilatYuzdesiAktif = activeSummary.tahsilatYuzdesi;

  const tumToplam = homeSummary.toplam;
  const tumOdeme = homeSummary.tumOdeme;
  const tumFatura = homeSummary.tumFatura;
  const tumOdenenTutar = homeSummary.odenen;
  const tumKalanTutar = homeSummary.kalan;
  const tahsilatYuzdesiGenel = homeSummary.tahsilatYuzdesi;

  const homeProjectStats = useMemo(
    () => buildHomeProjectStats(gorunenSekmeler, filteredHomeRows),
    [gorunenSekmeler, filteredHomeRows]
  );
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedVisibleIds = useMemo(
    () =>
      filteredActiveKayitlar
        .filter((row) => selectedIdSet.has(row.id))
        .map((row) => row.id),
    [filteredActiveKayitlar, selectedIdSet]
  );

  const temizle = () => {
    setProje("");
    setTutar("");
    setTarih("");
    setKdvli(false);
    setGvkli(false);
    setFaturaKesildi(false);
    setOdemeAlindi(false);
    setEditId(null);
    setInlineFocusColumn(null);
    if (aktifSekme) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[aktifSekme];
        return next;
      });
    }
  };

  const getExportRows = () => {
    const rows = viewMode === "home" ? filteredHomeRows : filteredActiveKayitlar;
    return rows.map((row) => ({
      sekme: row.grup || "",
      proje: row.proje || "",
      durum: row.odendi
        ? "Ödeme Alındı"
        : row.fatura_kesildi
          ? "Fatura Kesildi"
          : "Ödenmedi",
      faturaTarihi: row.fatura_tarihi || "",
      tutar: Number(row.tutar || 0),
    }));
  };

  const exportExcel = () => {
    const rows = getExportRows();
    const headers = ["Sekme", "Proje", "Durum", "Fatura Tarihi", "Tutar"];
    const csvRows = rows.map((row) => [
      row.sekme,
      row.proje,
      row.durum,
      row.faturaTarihi,
      row.tutar,
    ]);

    const csv = [headers, ...csvRows]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      viewMode === "home"
        ? "odeme-paneli-genel.xls"
        : `${aktifSekme || "proje"}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportWord = () => {
    const rows = getExportRows();
    const title =
      viewMode === "home"
        ? "ÖDEDİ Mİ Genel Özet"
        : `${aktifSekme || "Proje"} Özeti`;
    const html = `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
      h1 { font-size: 24px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #D1D5DB; padding: 10px 12px; text-align: left; font-size: 13px; }
      th { background: #EFF6FF; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <table>
      <thead>
        <tr>
          <th>Sekme</th>
          <th>Proje</th>
          <th>Durum</th>
          <th>Fatura Tarihi</th>
          <th>Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
              <td>${row.sekme}</td>
              <td>${row.proje}</td>
              <td>${row.durum}</td>
              <td>${row.faturaTarihi}</td>
              <td>${tl(row.tutar)}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </body>
</html>`;

    const blob = new Blob(["\ufeff", html], {
      type: "application/msword;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      viewMode === "home"
        ? "odeme-paneli-genel.doc"
        : `${aktifSekme || "proje"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInvoicePicker = (rowId: number) => {
    setInvoiceTargetId(rowId);
    invoiceInputRef.current?.click();
  };

  const uploadInvoice = async (row: Odeme, file: File) => {
    if (!authUserId) return;

    if (!isAllowedInvoiceFile(file)) {
      setMsg("Fatura yüklenemedi: PDF, PNG, JPG, JPEG, WEBP, GIF, HEIC veya HEIF yükleyebilirsin.");
      return;
    }

    if (file.size > MAX_INVOICE_FILE_SIZE_BYTES) {
      setMsg(
        `Fatura yüklenemedi: Dosya boyutu en fazla ${MAX_INVOICE_FILE_SIZE_MB} MB olabilir.`
      );
      return;
    }

    setUploadingInvoiceId(row.id);

    const safeName = sanitizeFileName(file.name);
    const path = `${authUserId}/${row.id}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("faturalar")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });

    if (error) {
      setMsg("Fatura yüklenemedi: " + error.message);
      setUploadingInvoiceId(null);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("faturalar")
      .getPublicUrl(path);

    const nextAttachment: InvoiceAttachment = {
      name: file.name,
      path,
      url: publicUrlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    };

    const { data: insertedAttachment, error: attachmentError } =
      await faturaEkleriTable()
        .insert({
          odeme_id: row.id,
          user_id: authUserId,
          name: nextAttachment.name,
          path: nextAttachment.path,
          url: nextAttachment.url,
          uploaded_at: nextAttachment.uploadedAt,
        } satisfies FaturaEkiInsert)
        .select()
        .single();

    if (attachmentError || !insertedAttachment) {
      await supabase.storage.from("faturalar").remove([path]);
      setMsg("Fatura kaydı oluşturulamadı: " + (attachmentError?.message || "Bilinmeyen hata"));
      setUploadingInvoiceId(null);
      return;
    }

    nextAttachment.id = Number(insertedAttachment.id);

    setInvoiceMap((prev) => ({
      ...prev,
      [row.id]: [...(prev[row.id] || []), nextAttachment],
    }));

    setMsg("Fatura yüklendi.");
    pushActivity("Fatura yüklendi", `${row.proje || "Kayıt"} · ${file.name}`);
    setUploadingInvoiceId(null);
  };
  const removeInvoice = async (rowId: number, attachment: InvoiceAttachment) => {
    const metadataDelete = attachment.id
      ? await faturaEkleriTable().delete().eq("id", attachment.id)
      : await faturaEkleriTable().delete().eq("path", attachment.path);

    if (metadataDelete.error) {
      setMsg("Fatura kaydı silinemedi: " + metadataDelete.error.message);
      return;
    }

    const { error } = await supabase.storage.from("faturalar").remove([attachment.path]);

    if (error) {
      setMsg("Fatura silinemedi: " + error.message);
      return;
    }

    setInvoiceMap((prev) => ({
      ...prev,
      [rowId]: (prev[rowId] || []).filter((item) => item.path !== attachment.path),
    }));

    setMsg("Fatura kaldırıldı.");
    pushActivity("Fatura kaldırıldı", attachment.name);
  };

  const deleteInvoicesForRows = async (rowIds: number[]) => {
    if (!rowIds.length) return { error: null as string | null };

    const { data: attachments, error: attachmentsError } = await faturaEkleriTable()
      .select("id, odeme_id, path")
      .in("odeme_id", rowIds);

    if (attachmentsError) {
      return { error: "Fatura kayıtları alınamadı: " + attachmentsError.message };
    }

    const typedAttachments = ((attachments || []) as Array<{
      id: number | null;
      odeme_id: number | null;
      path: string | null;
    }>).filter((item) => item.path);

    const attachmentPaths = typedAttachments
      .map((item) => item.path || "")
      .filter(Boolean);

    if (attachmentPaths.length) {
      const { error: storageError } = await supabase.storage
        .from("faturalar")
        .remove(attachmentPaths);

      if (storageError) {
        return { error: "Fatura dosyaları silinemedi: " + storageError.message };
      }
    }

    if (typedAttachments.length) {
      const attachmentIds = typedAttachments
        .map((item) => item.id)
        .filter((item): item is number => typeof item === "number");

      if (attachmentIds.length) {
        const { error: deleteError } = await faturaEkleriTable()
          .delete()
          .in("id", attachmentIds);

        if (deleteError) {
          return { error: "Fatura kayıtları silinemedi: " + deleteError.message };
        }
      }
    }

    setInvoiceMap((prev) => {
      const next = { ...prev };
      rowIds.forEach((rowId) => {
        delete next[rowId];
      });
      return next;
    });

    return { error: null as string | null };
  };

  void deleteInvoicesForRows;

  const runManageRequest = async (
    payload:
      | { action: "delete_record"; id: number }
      | { action: "delete_tab"; tabName: string }
      | { action: "rename_tab"; tabName: string; nextTabName: string }
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      return { error: "İşlem için oturum doğrulanamadı." };
    }

    const response = await fetch("/api/odemeler/manage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { error: body.error || "İşlem gerçekleştirilemedi." };
    }

    return { error: null as string | null };
  };

  const runBulkRequest = async (
    payload:
      | { action: "update"; ids: number[]; fields: Partial<OdemeUpdate> }
      | { action: "delete" | "invoice" | "paid"; ids: number[] }
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      return { error: "İşlem için oturum doğrulanamadı." };
    }

    const response = await fetch("/api/odemeler/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { error: body.error || "Toplu işlem gerçekleştirilemedi." };
    }

    return { error: null as string | null };
  };

  const exportPDF = async () => {
    try {
      setMsg("PDF hazırlanıyor...");

      await loadScript(
        "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
      );
      await loadScript(
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
      );

      const target = viewMode === "project" ? projectPdfRef.current : exportRef.current;
      if (!target) {
        setMsg("PDF alanı bulunamadı.");
        return;
      }

      const pdfWindow = window as PdfWindow;
      const html2canvas = pdfWindow.html2canvas;
      const jsPDF = pdfWindow.jspdf?.jsPDF;

      if (!html2canvas || !jsPDF) {
        setMsg("PDF araçları yüklenemedi.");
        return;
      }

      const exportWidth = target.scrollWidth;
      const exportHeight = target.scrollHeight;
      const pdfTargetSelector = '[data-pdf-export-target="true"]';

      target.setAttribute("data-pdf-export-target", "true");
      const canvas = await (async () => {
        try {
          return await html2canvas(target, {
            scale: 2,
            useCORS: true,
            width: exportWidth,
            height: exportHeight,
            windowWidth: exportWidth,
            backgroundColor: "#ffffff",
            onclone: (documentClone: Document) => {
              documentClone.querySelectorAll<HTMLElement>(".no-print").forEach((item) => {
                item.style.display = "none";
              });

              const clonedTarget =
                documentClone.querySelector<HTMLElement>(pdfTargetSelector);
              if (clonedTarget) {
                clonedTarget.style.width = "100%";
                clonedTarget.style.maxWidth = "100%";
                clonedTarget.style.boxShadow = "none";
                clonedTarget.style.borderRadius = "12px";
                clonedTarget.style.padding = "12px";
                clonedTarget.style.background = "#ffffff";
              }

              documentClone
                .querySelectorAll<HTMLElement>(`${pdfTargetSelector} .content-card`)
                .forEach((item) => {
                  item.style.boxShadow = "none";
                });

              documentClone
                .querySelectorAll<HTMLElement>(`${pdfTargetSelector} table`)
                .forEach((item) => {
                  item.style.width = "100%";
                  item.style.minWidth = "760px";
                  item.style.borderCollapse = "collapse";
                  item.style.borderSpacing = "0";
                });

              documentClone
                .querySelectorAll<HTMLElement>(`${pdfTargetSelector} th`)
                .forEach((item) => {
                  item.style.padding = "10px 12px";
                  item.style.fontSize = "12px";
                  item.style.lineHeight = "1.25";
                });

              documentClone
                .querySelectorAll<HTMLElement>(`${pdfTargetSelector} td`)
                .forEach((item) => {
                  item.style.padding = "12px";
                  item.style.fontSize = "12px";
                  item.style.lineHeight = "1.35";
                });

              documentClone
                .querySelectorAll<HTMLElement>(`${pdfTargetSelector} .status-button`)
                .forEach((item) => {
                  const status = item.dataset.status;
                  const label =
                    item.querySelector<HTMLElement>(".status-label")?.textContent?.trim() ||
                    item.textContent?.trim() ||
                    "";
                  const color =
                    status === "paid" ? "#166534" : status === "invoiced" ? "#92400E" : "#9F1239";

                  item.replaceChildren(documentClone.createTextNode(label));
                  item.style.display = "inline";
                  item.style.minHeight = "0";
                  item.style.padding = "0";
                  item.style.lineHeight = "1";
                  item.style.opacity = "1";
                  item.style.background = "transparent";
                  item.style.color = color;
                  item.style.border = "none";
                  item.style.verticalAlign = "middle";
                  item.style.transform = "none";
                  item.style.boxShadow = "none";
                  item.style.fontWeight = "800";
                  item.style.fontSize = "12px";
                });

              documentClone
                .querySelectorAll<HTMLElement>(`${pdfTargetSelector} [style*="overflow"]`)
                .forEach((item) => {
                  item.style.overflow = "visible";
                });

              documentClone.querySelectorAll<HTMLElement>(".money-value").forEach((item) => {
                item.style.filter = "none";
                item.style.opacity = "1";
                item.style.textShadow = "none";
                item.style.color = "";
                item.style.userSelect = "";
                item.style.pointerEvents = "";
                item.removeAttribute("data-private-value");
                item.removeAttribute("data-mask");
              });
            },
          });
        } finally {
          target.removeAttribute("data-pdf-export-target");
        }
      })();

      const imgData = canvas.toDataURL("image/png");
      const isProjectPdf = viewMode === "project";
      const pageWidth = isProjectPdf ? 297 : 210;
      const minimumPageHeight = isProjectPdf ? 210 : 297;
      const margin = isProjectPdf ? 7 : 10;
      const maxImgWidth = pageWidth - margin * 2;
      const naturalImgHeight = (canvas.height * maxImgWidth) / canvas.width;
      const pageHeight = Math.max(minimumPageHeight, naturalImgHeight + margin * 2);
      const maxImgHeight = pageHeight - margin * 2;
      const scale = Math.min(maxImgWidth / canvas.width, maxImgHeight / canvas.height);
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;
      const pdf = new jsPDF(isProjectPdf ? "l" : "p", "mm", [pageWidth, pageHeight]);

      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

      pdf.save(
        viewMode === "home"
          ? "odeme-paneli-genel.pdf"
          : `${aktifSekme || "proje"}.pdf`
      );
      setMsg("PDF indirildi.");
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "PDF oluşturulamadı.");
    }
  };

  const editAc = (row: Odeme, focusColumn: ProjectColumnKey = "proje") => {
    setMsg("");
    setEditId(row.id);
    setInlineFocusColumn(focusColumn);
    setProje(row.proje || "");
    setTutar(row.tutar ? String(row.tutar) : "");
    setTarih(row.fatura_tarihi || "");
    setKdvli(Boolean(row.kdvli));
    setGvkli(Boolean(row.gvkli));
    setFaturaKesildi(Boolean(row.fatura_kesildi));
    setOdemeAlindi(Boolean(row.odendi));
  };

  const getSelectionTargets = (sourceId: number) =>
    selectedIdSet.has(sourceId) && selectedVisibleIds.includes(sourceId)
      ? selectedVisibleIds
      : [sourceId];

  const changedFieldsForSelectedRows = (
    original: Odeme | null,
    next: OdemeInsert
  ): Partial<OdemeUpdate> => {
    if (!original) return {};

    const fields: Partial<OdemeUpdate> = {};
    const comparisons: Array<[
      keyof OdemeUpdate,
      Odeme[keyof Odeme],
      OdemeInsert[keyof OdemeInsert],
    ]> = [
      ["proje", original.proje, next.proje],
      ["tutar", original.tutar, next.tutar],
      ["fatura_tarihi", original.fatura_tarihi, next.fatura_tarihi],
      ["fatura_kesildi", original.fatura_kesildi, next.fatura_kesildi],
      ["odendi", original.odendi, next.odendi],
      ["grup", original.grup, next.grup],
      ["kdvli", original.kdvli, next.kdvli],
      ["gvkli", original.gvkli, next.gvkli],
    ];

    comparisons.forEach(([key, before, after]) => {
      if (before !== after) {
        fields[key] = after as never;
      }
    });

    return fields;
  };

  const markRowsUpdated = (ids: number[], now = new Date().toISOString()) => {
    setRowMeta((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = {
          createdAt: prev[id]?.createdAt || now,
          updatedAt: now,
        };
      });
      return next;
    });
  };

  async function kaydet() {
    if (!aktifSekme || !proje.trim() || !authUserId) return;

    const nextSira =
      aktifKayitlar.length > 0
        ? Math.max(...aktifKayitlar.map((x) => x.sira ?? 0)) + 1
        : 1;

    const payload: OdemeInsert = {
      user_id: authUserId,
      proje: proje.trim(),
      tutar: tutar ? Number(tutar) : null,
      fatura_tarihi: tarih || null,
      fatura_kesildi: odemeAlindi ? true : faturaKesildi,
      odendi: odemeAlindi,
      grup: aktifSekme,
      kdvli,
      gvkli,
      ...(editId ? {} : { sira: nextSira }),
    };

    const now = new Date().toISOString();
    const originalRow = editId ? data.find((row) => row.id === editId) ?? null : null;
    const targetIds = editId ? getSelectionTargets(editId) : [];
    const peerIds = targetIds.filter((id) => id !== editId);
    const sharedFields = changedFieldsForSelectedRows(originalRow, payload);

    if (editId) {
      const { error } = await odemelerTable()
        .update(payload satisfies OdemeUpdate)
        .eq("id", editId);

      if (error) {
        setMsg("Kayıt kaydedilemedi: " + error.message);
        return;
      }

      markRowsUpdated([editId], now);

      setData((prev) =>
        prev.map((row) => (row.id === editId ? { ...row, ...payload } : row))
      );
    } else {
      const { data: insertedRow, error } = await odemelerTable()
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        setMsg("Kayıt kaydedilemedi: " + error.message);
        return;
      }

      if (insertedRow) {
        const row = insertedRow as Odeme;
        setData((prev) => [...prev, row]);
        markRowsUpdated([row.id], now);
      }
    }

    if (editId && peerIds.length && Object.keys(sharedFields).length > 0) {
      const bulkResult = await runBulkRequest({
        action: "update",
        ids: peerIds,
        fields: sharedFields,
      });

      if (bulkResult.error) {
        setMsg("Kayıt güncellendi, seçili kayıtlara uygulanamadı: " + bulkResult.error);
        return;
      }

      markRowsUpdated(peerIds, now);
      const peerIdSet = new Set(peerIds);
      setData((prev) =>
        prev.map((row) => (peerIdSet.has(row.id) ? { ...row, ...sharedFields } : row))
      );
    }

    temizle();
    setMsg(
      editId && peerIds.length && Object.keys(sharedFields).length > 0
        ? `${targetIds.length} seçili kayıt güncellendi.`
        : editId
          ? "Kayıt güncellendi."
          : "Kayıt eklendi."
    );
    pushActivity(
      editId && peerIds.length && Object.keys(sharedFields).length > 0
        ? "Seçili kayıtlar güncellendi"
        : editId
          ? "Kayıt güncellendi"
          : "Kayıt eklendi",
      editId && peerIds.length && Object.keys(sharedFields).length > 0
        ? `${targetIds.length} kayıt · ${payload.proje || "Kayıt"}`
        : `${aktifSekme} · ${payload.proje || "Yeni kayıt"}`
    );
  }

  async function kaydiKopyala(row: Odeme) {
    if (!authUserId) return;

    const nextSira =
      aktifKayitlar.length > 0
        ? Math.max(...aktifKayitlar.map((x) => x.sira ?? 0)) + 1
        : 1;

    const { data: copiedRow, error } = await odemelerTable().insert([
      {
        user_id: authUserId,
        proje: `${row.proje || "Yeni Kayıt"} Kopya`,
        tutar: row.tutar,
        odendi: row.odendi,
        grup: row.grup,
        fatura_tarihi: row.fatura_tarihi,
        fatura_kesildi: row.fatura_kesildi,
        kdvli: row.kdvli,
        gvkli: row.gvkli,
        sira: nextSira,
      },
    ] satisfies OdemeInsert[]).select("*").single();

    if (error) {
      setMsg("Kopyalama başarısız: " + error.message);
      return;
    }

    if (copiedRow) {
      const now = new Date().toISOString();
      const nextRow = copiedRow as Odeme;
      setData((prev) => [...prev, nextRow]);
      markRowsUpdated([nextRow.id], now);
    }

    setMsg("Kayıt çoğaltıldı.");
    pushActivity("Kayıt çoğaltıldı", `${row.grup || "Proje"} · ${row.proje || "Yeni Kayıt"}`);
  }

  async function durumIlerle(row: Odeme) {
    let next = { fatura_kesildi: false, odendi: false };

    if (!row.odendi && !row.fatura_kesildi) {
      next = { fatura_kesildi: true, odendi: false };
    } else if (!row.odendi && row.fatura_kesildi) {
      next = { fatura_kesildi: true, odendi: true };
    }

    const nextUpdate: OdemeUpdate = next;
    const targetIds = getSelectionTargets(row.id);
    const result =
      targetIds.length > 1
        ? await runBulkRequest({ action: "update", ids: targetIds, fields: nextUpdate })
        : await odemelerTable().update(nextUpdate).eq("id", row.id).then(({ error }) => ({
            error: error?.message || null,
          }));

    if (result.error) {
      setMsg("Durum güncellenemedi: " + result.error);
      return;
    }

    const now = new Date().toISOString();
    markRowsUpdated(targetIds, now);
    const targetIdSet = new Set(targetIds);
    setData((prev) => prev.map((x) => (targetIdSet.has(x.id) ? { ...x, ...next } : x)));
    setMsg(targetIds.length > 1 ? `${targetIds.length} seçili kaydın durumu güncellendi.` : "");
    pushActivity(
      targetIds.length > 1 ? "Seçili durumlar güncellendi" : "Durum güncellendi",
      targetIds.length > 1
        ? `${targetIds.length} kayıt`
        : `${row.grup || "Proje"} · ${row.proje || "Kayıt"}`
    );
  }

  async function undoDelete() {
    if (!lastDeleted?.length || !authUserId) return;

    const payload: OdemeInsert[] = lastDeleted.map((row) => ({
      user_id: authUserId,
      proje: row.proje,
      tutar: row.tutar,
      odendi: row.odendi,
      grup: row.grup,
      fatura_tarihi: row.fatura_tarihi,
      fatura_kesildi: row.fatura_kesildi,
      kdvli: row.kdvli,
      gvkli: row.gvkli,
      sira: row.sira,
    }));

    const { error } = await odemelerTable().insert(payload);

    if (error) {
      setMsg("Geri alma başarısız: " + error.message);
      return;
    }

    setLastDeleted(null);
    setMsg("Silinen kayıtlar geri yüklendi.");
    pushActivity("Kayıtlar geri yüklendi", `${lastDeleted.length} kayıt geri alındı`);
    await yukle();
  }

  async function kayitSil(id: number) {
    const row = data.find((x) => x.id === id) || null;
    const result = await runManageRequest({ action: "delete_record", id });

    if (result.error) {
      setMsg(result.error);
      return;
    }

    if (row) setLastDeleted([row]);
    if (editId === id) temizle();
    setData((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setInvoiceMap((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setMsg("Kayıt silindi.");
    pushActivity("Kayıt silindi", `${row?.grup || "Proje"} · ${row?.proje || id}`);
  }

  async function sekmeSil(tabName: string) {
    const onay = window.confirm(
      `${tabName} sekmesindeki tüm kayıtlar silinecek. Emin misin?`
    );
    if (!onay) return;

    const result = await runManageRequest({ action: "delete_tab", tabName });
    if (result.error) {
      setMsg(result.error);
      return;
    }

    const kalanSekmeler = sekmeler.filter((s) => s !== tabName);

    if (aktifSekme === tabName) {
      if (kalanSekmeler.length) {
        openProjectTab(kalanSekmeler[0]);
      } else {
        setAktifSekme("");
        setViewMode("home");
      }
    }

    setMsg(`${tabName} sekmesi silindi.`);
    pushActivity("Sekme silindi", tabName);
    await yukle();
  }

  async function sekmeYenidenAdlandir(tabName: string) {
    const yeniAd = window.prompt("Sekmenin yeni adı ne olsun?", tabName);
    if (!yeniAd || !yeniAd.trim()) return;

    const nextName = yeniAd.trim();
    const result = await runManageRequest({
      action: "rename_tab",
      tabName,
      nextTabName: nextName,
    });

    if (result.error) {
      setMsg(result.error);
      return;
    }

    setTabMeta((prev) => {
      const next = { ...prev };
      if (next[tabName]) {
        next[nextName] = next[tabName];
        delete next[tabName];
      }
      return next;
    });

    setArchivedTabs((prev) => prev.map((x) => (x === tabName ? nextName : x)));

    if (aktifSekme === tabName) {
      openProjectTab(nextName);
    }

    setMsg("Sekme adı güncellendi.");
    pushActivity("Sekme yeniden adlandırıldı", `${tabName} → ${nextName}`);
    await yukle();
  }

  async function satirTasi(
    dragId: number,
    targetId: number,
    position: DropPosition = "before"
  ) {
    if (dragId === targetId) return;

    const rows = [...aktifKayitlar];
    const from = rows.findIndex((x) => x.id === dragId);
    const targetIndex = rows.findIndex((x) => x.id === targetId);

    if (from === -1 || targetIndex === -1) return;

    const [moved] = rows.splice(from, 1);
    const adjustedTargetIndex =
      from < targetIndex ? targetIndex - 1 : targetIndex;
    const insertIndex =
      position === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    rows.splice(insertIndex, 0, moved);

    const updated = rows.map((r, i) => ({ ...r, sira: i + 1 }));

    setData((prev) =>
      prev.map((row) => {
        const f = updated.find((u) => u.id === row.id);
        return f ? { ...row, sira: f.sira } : row;
      })
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      setMsg("Sıralama için oturum doğrulanamadı.");
      await yukle();
      return;
    }

    const response = await fetch("/api/odemeler/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ids: updated.map((row) => row.id),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMsg(payload.error || "Sıralama kaydedilemedi.");
      await yukle();
    }
  }

  const handleRowDragOver = (event: DragEvent<HTMLTableRowElement>, rowId: number) => {
    if (sortKey !== "manual" || draggedId === null) return;

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientY - bounds.top;
    const nextPosition = offset < bounds.height / 2 ? "before" : "after";

    setDragOverId(rowId);
    setDropPosition(nextPosition);
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const sortToggle = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortKey("manual");
    setSortDirection("asc");
  };

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const moveProjectColumn = (
    source: ProjectColumnKey,
    target: ProjectColumnKey,
    position: DropPosition
  ) => {
    if (source === target) return;

    setProjectColumnOrder((prev) => {
      const withoutSource = prev.filter((key) => key !== source);
      const targetIndex = withoutSource.indexOf(target);
      if (targetIndex === -1) return prev;

      const insertAt = position === "before" ? targetIndex : targetIndex + 1;
      const next = [...withoutSource];
      next.splice(insertAt, 0, source);
      return next;
    });
  };

  const handleColumnDragOver = (
    event: DragEvent<HTMLTableCellElement>,
    column: ProjectColumnKey
  ) => {
    const payload = event.dataTransfer.getData("text/plain");
    const activeColumn =
      draggedColumnRef.current ??
      draggedColumn ??
      (isProjectColumnKey(payload) ? payload : null);

    if (!activeColumn || activeColumn === column) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    if (draggedColumn !== activeColumn) {
      setDraggedColumn(activeColumn);
    }
    draggedColumnRef.current = activeColumn;
    setDragOverColumn(column);
    setColumnDropPosition(offset < rect.width / 2 ? "before" : "after");
  };

  const moveHomeProjectColumn = (
    source: HomeProjectColumnKey,
    target: HomeProjectColumnKey,
    position: DropPosition
  ) => {
    if (source === target) return;

    setHomeProjectColumnOrder((prev) => {
      const withoutSource = prev.filter((key) => key !== source);
      const targetIndex = withoutSource.indexOf(target);
      if (targetIndex === -1) return prev;

      const insertAt = position === "before" ? targetIndex : targetIndex + 1;
      const next = [...withoutSource];
      next.splice(insertAt, 0, source);
      return next;
    });
  };

  const handleHomeColumnDragOver = (
    event: DragEvent<HTMLTableCellElement>,
    column: HomeProjectColumnKey
  ) => {
    const payload = event.dataTransfer.getData("text/plain");
    const activeColumn =
      draggedHomeColumnRef.current ??
      draggedHomeColumn ??
      (isHomeProjectColumnKey(payload) ? payload : null);

    if (!activeColumn || activeColumn === column) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    if (draggedHomeColumn !== activeColumn) {
      setDraggedHomeColumn(activeColumn);
    }
    draggedHomeColumnRef.current = activeColumn;
    setDragOverHomeColumn(column);
    setHomeColumnDropPosition(offset < rect.width / 2 ? "before" : "after");
  };

  const durumGorunum = (row: Odeme) => {
    if (row.odendi) {
      return {
        text: "ÖDEME ALINDI",
        bg: theme === "dark" ? "rgba(60, 193, 139, 0.18)" : "#EAF8F0",
        color: theme === "dark" ? "#9BE4BF" : "#2A8B62",
        rowBg: theme === "dark" ? "#0C1813" : "#FBFEFC",
      };
    }

    if (row.fatura_kesildi) {
      return {
        text: "FATURA KESİLDİ",
        bg: theme === "dark" ? "rgba(255, 186, 104, 0.18)" : "#FFF4E7",
        color: theme === "dark" ? "#FFD08F" : "#D88724",
        rowBg: theme === "dark" ? "#17120B" : "#FFFDF8",
      };
    }

    return {
      text: "ÖDENMEDİ",
      bg: theme === "dark" ? "rgba(244, 114, 182, 0.14)" : "#FDEEF3",
      color: theme === "dark" ? "#F4A4C7" : "#C25A84",
      rowBg: theme === "dark" ? "#181017" : "#FFF9FB",
    };
  };

  const aktifTabMeta = tabMeta[aktifSekme] || { color: "var(--blue)" };

  const projectColumns = projectColumnOrder.map((key) => {
    if (key === "select") {
      return {
        key,
        label: "SEÇ",
        className: "no-print",
        style: { ...styles.th, width: 44 },
      };
    }

    if (key === "sira") {
      return {
        key,
        label: `SIRA ${sortKey === "manual" ? "●" : ""}`,
        className: "",
        style: {
          ...styles.th,
          background: "var(--slateSoft)",
          cursor: "pointer",
          width: 52,
        },
        onClick: () => {
          setSortKey("manual");
          setSortDirection("asc");
        },
      };
    }

    if (key === "proje") {
      return {
        key,
        label: `PROJE ${arrow("proje")}`,
        className: "",
        style: {
          ...styles.th,
          background: "var(--blueSoft)",
          cursor: "pointer",
          width: 240,
        },
        onClick: () => sortToggle("proje"),
      };
    }

    if (key === "durum") {
      return {
        key,
        label: `DURUM ${arrow("durum")}`,
        className: "",
        style: {
          ...styles.th,
          background: "var(--tealSoft)",
          cursor: "pointer",
          width: 180,
        },
        onClick: () => sortToggle("durum"),
      };
    }

    if (key === "fatura_tarihi") {
      return {
        key,
        label: `FATURA TARİHİ ${arrow("fatura_tarihi")}`,
        className: "",
        style: {
          ...styles.th,
          background: "var(--amberSoft)",
          cursor: "pointer",
          width: 120,
        },
        onClick: () => sortToggle("fatura_tarihi"),
      };
    }

    if (key === "tutar") {
      return {
        key,
        label: `TUTAR ${arrow("tutar")}`,
        className: "",
        style: {
          ...styles.th,
          background: "var(--redSoft)",
          cursor: "pointer",
          width: 120,
        },
        onClick: () => sortToggle("tutar"),
      };
    }

    return {
      key,
      label: "İŞLEM",
      className: "no-print",
      style: { ...styles.th, width: 122 },
    };
  });

  const homeProjectColumns = homeProjectColumnOrder.map((key) => {
    if (key === "proje") {
      return {
        key,
        label: "PROJE",
        style: { ...styles.th, background: "var(--blueSoft)" },
      };
    }

    if (key === "kayit") {
      return {
        key,
        label: "KAYIT",
        style: { ...styles.th, background: "var(--tealSoft)" },
      };
    }

    if (key === "odeme") {
      return {
        key,
        label: "ÖDEME",
        style: { ...styles.th, background: "var(--amberSoft)" },
      };
    }

    if (key === "fatura") {
      return {
        key,
        label: "FATURA",
        style: { ...styles.th, background: "var(--redSoft)" },
      };
    }

    return {
      key,
      label: "TOPLAM",
      style: { ...styles.th, background: "var(--slateSoft)" },
    };
  });

  const renderProjectCell = (
    column: ProjectColumnKey,
    row: Odeme,
    options: {
      durum: ReturnType<typeof durumGorunum>;
      editing: boolean;
      meta?: RowMeta;
      invoices: InvoiceAttachment[];
      isDragSource: boolean;
    }
  ) => {
    const { durum, editing, meta, invoices, isDragSource } = options;

    if (column === "select") {
      return (
        <td key={column} style={{ ...styles.td, width: 44 }} className="no-print">
          <button
            type="button"
            onClick={() => toggleSelected(row.id)}
            style={styles.checkboxBtn}
            title="Kaydı seç"
          >
            {selectedIdSet.has(row.id) ? (
              <CheckSquare size={18} color={palette.blue} />
            ) : (
              <Square size={18} color={palette.muted} />
            )}
          </button>
        </td>
      );
    }

    if (column === "sira") {
      return (
        <td
          key={column}
          draggable={sortKey === "manual"}
          onDragStart={() => {
            if (sortKey === "manual") setDraggedId(row.id);
          }}
          onDragEnd={() => {
            setDraggedId(null);
            setDragOverId(null);
          }}
          style={{
            ...styles.td,
            width: 52,
            cursor: sortKey === "manual" ? "grab" : "default",
            color: "var(--muted)",
            fontWeight: 700,
          }}
          title={
            sortKey === "manual"
              ? "Sürükle"
              : "Manuel sıralama için SIRA başlığına tıkla"
          }
        >
          {isDragSource ? "•••" : "≡"}
        </td>
      );
    }

    if (column === "proje") {
      return (
        <td
          key={column}
          onDoubleClick={() => editAc(row, "proje")}
          title="Düzenlemek için çift tıkla"
          style={{
            ...styles.td,
            width: 280,
            borderLeft: `4px solid ${aktifTabMeta.color}`,
            cursor: "pointer",
          }}
        >
          {editing ? (
            <input
              className="soft-input"
              autoFocus={inlineFocusColumn === "proje"}
              value={proje}
              onChange={(e) => setProje(e.target.value)}
              style={styles.input}
            />
          ) : (
            <div>
              <div style={{ fontWeight: 800 }}>{row.proje || "—"}</div>
              {invoices.length > 0 ? (
                <div style={styles.invoiceList}>
                  {invoices.map((attachment) => (
                    <div key={attachment.path} style={styles.invoiceChip}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.invoiceLink}
                      >
                        {attachment.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => void removeInvoice(row.id, attachment)}
                        style={styles.invoiceRemoveBtn}
                        title="Faturayı kaldır"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={styles.metaText}>
                Oluşturma: {shortDateTime(meta?.createdAt || null)}
              </div>
              <div style={styles.metaText}>
                Güncelleme: {shortDateTime(meta?.updatedAt || null)}
              </div>
            </div>
          )}
        </td>
      );
    }

    if (column === "durum") {
      return (
        <td
          key={column}
          onDoubleClick={() => editAc(row, "durum")}
          title="Düzenlemek için çift tıkla"
          style={{ ...styles.td, width: 150, cursor: "pointer" }}
        >
          {editing ? (
            <select
              className="soft-input"
              autoFocus={inlineFocusColumn === "durum"}
              value={
                odemeAlindi ? "odeme" : faturaKesildi ? "fatura" : "bekliyor"
              }
              onChange={(e) => {
                const v = e.target.value;
                setOdemeAlindi(v === "odeme");
                setFaturaKesildi(v === "fatura" || v === "odeme");
              }}
              style={styles.input}
            >
              <option value="odeme">ÖDEME ALINDI</option>
              <option value="bekliyor">ÖDENMEDİ</option>
              <option value="fatura">FATURA KESİLDİ</option>
            </select>
          ) : (
            <button
              className="status-button"
              data-status={row.odendi ? "paid" : row.fatura_kesildi ? "invoiced" : "waiting"}
              type="button"
              onClick={async () => await durumIlerle(row)}
              style={{
                ...styles.status,
                background: durum.bg,
                color: durum.color,
                border: `1px solid ${durum.color}55`,
              }}
            >
              <span
                style={{
                  ...styles.dot,
                  background: durum.color,
                }}
              />
              <span className="status-label">{durum.text}</span>
            </button>
          )}
        </td>
      );
    }

    if (column === "fatura_tarihi") {
      return (
        <td
          key={column}
          onDoubleClick={() => editAc(row, "fatura_tarihi")}
          title="Düzenlemek için çift tıkla"
          style={{ ...styles.td, width: 100, cursor: "pointer" }}
        >
          {editing ? (
            <input
              className="soft-input"
              autoFocus={inlineFocusColumn === "fatura_tarihi"}
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              style={styles.input}
            />
          ) : (
            shortDate(row.fatura_tarihi)
          )}
        </td>
      );
    }

    if (column === "tutar") {
      return (
        <td
          key={column}
          onDoubleClick={() => editAc(row, "tutar")}
          title="Düzenlemek için çift tıkla"
          style={{
            ...styles.td,
            width: 110,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {editing ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                className="soft-input"
                autoFocus={inlineFocusColumn === "tutar"}
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                style={styles.input}
              />
              <select
                className="soft-input"
                value={taxModeFromFlags(kdvli, gvkli)}
                onChange={(e) => {
                  const next = taxFlagsFromMode(e.target.value);
                  setKdvli(next.kdvli);
                  setGvkli(next.gvkli);
                }}
                style={styles.input}
              >
                <option value="none">Vergisiz</option>
                <option value="kdv">+ %20 KDV</option>
                <option value="gvk">- %15 GVK</option>
                <option value="kdv_gvk">+ %20 KDV / - %15 GVK</option>
              </select>
              <button className="hover-button" onClick={kaydet} style={styles.secondaryBtn}>
                Kaydet
              </button>
              <button className="hover-button" onClick={temizle} style={styles.deleteBtn}>
                İptal
              </button>
            </div>
          ) : (
            <div>
              <div className="money-value" data-private-value="true" data-mask="₺0">
                {row.tutar ? tl(Number(row.tutar)) : "—"}
              </div>
              {row.kdvli ? <div style={styles.metaText}>+ %20 KDV</div> : null}
              {row.gvkli ? <div style={styles.metaText}>- %15 GVK</div> : null}
            </div>
          )}
        </td>
      );
    }

    return (
      <td key={column} style={{ ...styles.td, width: 108 }} className="no-print">
        <div style={styles.rowActions} className="row-actions-fade">
          <button
            className="hover-button"
            onClick={() => editAc(row)}
            style={styles.iconActionBtn}
            title="Düzenle"
          >
            <Pencil size={15} />
          </button>
          <button
            className="hover-button"
            onClick={() => void kaydiKopyala(row)}
            style={styles.iconActionBtn}
            title="Çoğalt"
          >
            <Copy size={15} />
          </button>
          <button
            className="hover-button"
            onClick={() => openInvoicePicker(row.id)}
            style={styles.iconActionBtn}
            title="Fatura yükle"
            disabled={uploadingInvoiceId === row.id}
          >
            <Upload size={15} />
          </button>
          <button
            className="hover-button"
            onClick={() => void kayitSil(row.id)}
            style={styles.iconDeleteBtn}
            title="Sil"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    );
  };

  async function authLogin() {
    if (!email.trim() || !authPassword.trim()) return;
    setAuthStoragePreference(rememberMe);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: authPassword,
    });

    if (error) {
      setMsg("Supabase giriş başarısız: " + error.message);
      return;
    }

    setMsg("Supabase ile giriş yapıldı.");
  }

  async function authSignUp() {
    if (!email.trim() || !authPassword.trim()) return;
    setAuthStoragePreference(rememberMe);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: authPassword,
      options: {
        emailRedirectTo:
          typeof window === "undefined" ? undefined : window.location.origin,
      },
    });

    if (error) {
      setMsg("Hesap oluşturulamadı: " + error.message);
      return;
    }

    setSignupMode(false);
    pushActivity("Hesap oluşturuldu", email.trim());
    setMsg("Hesap oluşturuldu. E-posta doğrulaması açıksa kutunu kontrol et.");
  }

  async function authResetPassword() {
    if (!email.trim()) {
      setMsg("Şifre sıfırlama için önce e-posta adresini gir.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo:
        typeof window === "undefined" ? undefined : window.location.origin,
    });

    if (error) {
      setMsg("Şifre sıfırlama e-postası gönderilemedi: " + error.message);
      return;
    }

    pushActivity("Şifre sıfırlama bağlantısı gönderildi", email.trim());
    setMsg("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
  }

  async function authLoginWithGoogle() {
    setAuthStoragePreference(rememberMe);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window === "undefined" ? undefined : window.location.origin,
      },
    });

    if (error) {
      setMsg("Google girişi başlatılamadı: " + error.message);
    }
  }

  async function authLoginWithFacebook() {
    setAuthStoragePreference(rememberMe);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo:
          typeof window === "undefined" ? undefined : window.location.origin,
      },
    });

    if (error) {
      setMsg("Facebook girişi başlatılamadı: " + error.message);
    }
  }

  async function cikisYap() {
    if (authEmail) {
      await supabase.auth.signOut();
    }
    setAuthEmail(null);
    setAuthUserId(null);
    setAuthProviders([]);
  }

  async function uploadProfilePhoto(file: File) {
    if (!authUserId) return;

    if (file.size > MAX_INVOICE_FILE_SIZE_BYTES) {
      setMsg(`Profil fotoğrafı en fazla ${MAX_INVOICE_FILE_SIZE_MB} MB olabilir.`);
      return;
    }

    setSettingsBusy(true);
    const safeName = sanitizeFileName(file.name);
    const path = `${authUserId}/profile/avatar-${safeName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
      });

    if (error) {
      setMsg("Profil fotoğrafı yüklenemedi: " + error.message);
      setSettingsBusy(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = publicUrlData.publicUrl;
    const { error: profileError } = await supabase.auth.updateUser({
      data: {
        display_name: settingsName.trim(),
        avatar_url: avatarUrl,
      },
    });

    if (profileError) {
      setMsg("Profil güncellenemedi: " + profileError.message);
      setSettingsBusy(false);
      return;
    }

    setSettingsAvatarUrl(avatarUrl);
    setMsg("Profil fotoğrafı güncellendi.");
    setSettingsBusy(false);
  }

  async function saveProfileSettings() {
    setSettingsBusy(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: settingsName.trim(),
        avatar_url: settingsAvatarUrl,
      },
    });

    if (error) {
      setMsg("Profil kaydedilemedi: " + error.message);
      setSettingsBusy(false);
      return;
    }

    pushActivity("Profil güncellendi", settingsName.trim() || authEmail || "Profil");
    setMsg("Hesap ayarları kaydedildi.");
    setSettingsBusy(false);
  }

  async function changePassword() {
    if (!settingsPassword.trim()) {
      setMsg("Yeni şifre alanı boş olamaz.");
      return;
    }

    if (settingsPassword.trim().length < 6) {
      setMsg("Yeni şifre en az 6 karakter olmalı.");
      return;
    }

    if (settingsPassword !== settingsPasswordRepeat) {
      setMsg("Şifre tekrar alanı eşleşmiyor.");
      return;
    }

    setSettingsBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: settingsPassword.trim(),
    });

    if (error) {
      setMsg("Şifre değiştirilemedi: " + error.message);
      setSettingsBusy(false);
      return;
    }

    setSettingsPassword("");
    setSettingsPasswordRepeat("");
    pushActivity("Şifre güncellendi", authEmail || "Hesap");
    setMsg("Şifre güncellendi.");
    setSettingsBusy(false);
  }

  async function closeAccountData() {
    if (!authUserId) return;

    const confirmed = window.confirm(
      "Bu işlem hesabı, panel verilerini ve yüklenen dosyaları kalıcı olarak siler. Devam edilsin mi?"
    );
    if (!confirmed) return;

    setSettingsBusy(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      setMsg("Hesap silme için oturum doğrulanamadı.");
      setSettingsBusy(false);
      return;
    }

    if (authProviders.includes("email")) {
      if (!authEmail || !settingsCurrentPassword.trim()) {
        setMsg("Hesabı kapatmak için mevcut şifreni gir.");
        setSettingsBusy(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: settingsCurrentPassword.trim(),
      });

      if (verifyError) {
        setMsg("Mevcut şifre doğrulanamadı.");
        setSettingsBusy(false);
        return;
      }
    }

    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        currentPassword: authProviders.includes("email")
          ? settingsCurrentPassword.trim()
          : undefined,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMsg(payload.error || "Hesap silinemedi.");
      setSettingsBusy(false);
      return;
    }

    await supabase.auth.signOut();
    setSettingsCurrentPassword("");
    setSettingsBusy(false);
    setMsg("Hesap ve tüm veriler silindi.");
  }

  function yeniProjeOlustur() {
    setNewProjectName("");
    setNewProjectFirstItem("");
    setNewProjectAmount("");
    setNewProjectDate("");
    setNewProjectKdvli(false);
    setNewProjectGvkli(false);
    setNewProjectInvoice(false);
    setNewProjectPaid(false);
    setNewProjectColor(
      DEFAULT_COLORS[Object.keys(tabMeta).length % DEFAULT_COLORS.length] || DEFAULT_COLORS[0]
    );
    setShowCreateProjectModal(true);
  }

  async function yeniProjeKaydet() {
    if (!authUserId) return;

    const clean = newProjectName.trim();
    if (!clean) {
      setMsg("Proje adı gerekli.");
      return;
    }

    if (sekmeler.includes(clean)) {
      setMsg("Bu proje adı zaten var.");
      return;
    }

    setTabMeta((prev) => ({
      ...prev,
      [clean]: {
        color: newProjectColor,
      },
    }));

    const firstItemName = newProjectFirstItem.trim();

    if (firstItemName) {
      const nextSira =
        data.filter((item) => (item.grup || "") === clean).length > 0
          ? Math.max(
              ...data
                .filter((item) => (item.grup || "") === clean)
                .map((item) => item.sira ?? 0)
            ) + 1
          : 1;

      const payload: OdemeInsert = {
        user_id: authUserId,
        proje: firstItemName,
        tutar: newProjectAmount ? Number(newProjectAmount) : null,
        odendi: newProjectPaid,
        grup: clean,
        fatura_tarihi: newProjectDate || null,
        fatura_kesildi: newProjectPaid ? true : newProjectInvoice,
        kdvli: newProjectKdvli,
        gvkli: newProjectGvkli,
        sira: nextSira,
      };

      const { error } = await odemelerTable().insert([payload]);
      if (error) {
        setMsg("Proje oluşturulamadı: " + error.message);
        return;
      }
    } else {
      setData((prev) => [
        ...prev,
        {
          id: -Date.now(),
          user_id: authUserId,
          proje: null,
          tutar: null,
          odendi: false,
          grup: clean,
          fatura_tarihi: null,
          fatura_kesildi: false,
          kdvli: false,
          gvkli: false,
          sira: null,
        },
      ]);
    }

    setShowCreateProjectModal(false);
    openProjectTab(clean);
    setMsg("Proje oluşturuldu.");
    pushActivity("Proje oluşturuldu", clean);
    await yukle();
  }

  const autoSaveInlineEdit = async () => {
    if (editId === null || inlineSaveInProgressRef.current) return;
    inlineSaveInProgressRef.current = true;
    try {
      await kaydet();
    } finally {
      inlineSaveInProgressRef.current = false;
    }
  };

  function sekmeGorunumDuzenle(tabName: string) {
    setTabMenu((prev) => ({ ...prev, visible: true, mode: "colors", tabName }));
  }

  function sekmeArsivDurumunuDegistir(tabName: string) {
    setArchivedTabs((prev) =>
      prev.includes(tabName)
        ? prev.filter((x) => x !== tabName)
        : [...prev, tabName]
    );

    if (tabName === aktifSekme && !showArchivedTabs) {
      const nextVisible = gorunenSekmeler.filter((x) => x !== tabName);
      if (nextVisible.length) {
        openProjectTab(nextVisible[0]);
      } else {
        setViewMode("home");
      }
    }
  }

  const renderAuthScreen = () => (
    <AuthScreen
      themeVars={themeVars}
      isMobileViewport={isMobileViewport}
      signupMode={isMobileViewport ? false : signupMode}
      setSignupMode={setSignupMode}
      email={email}
      setEmail={setEmail}
      authPassword={authPassword}
      setAuthPassword={setAuthPassword}
      rememberMe={rememberMe}
      setRememberMe={setRememberMe}
      authResetPassword={authResetPassword}
      authSignUp={authSignUp}
      authLogin={authLogin}
      authLoginWithGoogle={authLoginWithGoogle}
      authLoginWithFacebook={authLoginWithFacebook}
      msg={msg}
      styles={styles}
    />
  );

  const renderSettingsContent = () => (
    <SettingsContent
      mutedColor={palette.muted}
      redColor={palette.red}
      styles={styles}
      settingsAvatarUrl={settingsAvatarUrl}
      settingsName={settingsName}
      setSettingsName={setSettingsName}
      authEmail={authEmail}
      profileInputRef={profileInputRef}
      settingsBusy={settingsBusy}
      saveProfileSettings={saveProfileSettings}
      settingsPassword={settingsPassword}
      setSettingsPassword={setSettingsPassword}
      settingsPasswordRepeat={settingsPasswordRepeat}
      setSettingsPasswordRepeat={setSettingsPasswordRepeat}
      changePassword={changePassword}
      authResetPassword={authResetPassword}
      authProviders={authProviders}
      settingsCurrentPassword={settingsCurrentPassword}
      setSettingsCurrentPassword={setSettingsCurrentPassword}
      closeAccountData={closeAccountData}
      activityLog={activityLog}
    />
  );
  if (!authUserId) {
    return renderAuthScreen();
  }





  return (
    <div
      style={{ ...styles.page, ...themeVars }}
      className={privacyMode ? "privacy-mode" : undefined}
      onPointerDownCapture={(e) => {
        if (editId === null) return;
        const target = e.target instanceof HTMLElement ? e.target : null;
        if (target?.closest('[data-inline-edit-row="true"]')) return;
        void autoSaveInlineEdit();
      }}
    >
      <style>{`
        @keyframes panelFadeSlide{
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes floatIn{
          from{opacity:0;transform:translateY(14px) scale(.985)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        @keyframes menuPop{
          from{opacity:0;transform:translateY(8px) scale(.96)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        .view-panel{animation:panelFadeSlide .24s cubic-bezier(.22,1,.36,1)}
        .motion-card,
        .quick-grid > div,
        .hero-card,
        .content-card{
          animation:floatIn .34s cubic-bezier(.22,1,.36,1) both;
        }
        .stats-grid > .motion-card:nth-child(2),
        .quick-grid > div:nth-child(2){animation-delay:.04s}
        .stats-grid > .motion-card:nth-child(3),
        .quick-grid > div:nth-child(3){animation-delay:.08s}
        .stats-grid > .motion-card:nth-child(4),
        .quick-grid > div:nth-child(4){animation-delay:.12s}
        .export-menu{animation:menuPop .18s cubic-bezier(.22,1,.36,1)}
        .hover-button{transition:all .18s ease}
        .hover-button:hover{filter:brightness(.97);transform:translateY(-1px)}
        .soft-input{transition:border-color .18s ease,box-shadow .18s ease}
        .soft-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.10)}
        .login-showcase::before{
          content:"";
          position:absolute;
          inset:-35%;
          background:conic-gradient(from 160deg, rgba(56,189,248,.18), rgba(37,99,235,.08), rgba(20,184,166,.16), rgba(56,189,248,.18));
          animation:loginAurora 12s linear infinite;
        }
        .login-showcase::after{
          content:"";
          position:absolute;
          inset:-24px;
          background-image:radial-gradient(circle, rgba(147,197,253,0.52) 2px, transparent 2.4px);
          background-size:62px 62px;
          opacity:.72;
          animation:loginDotsDrift 7.5s ease-in-out infinite alternate;
          pointer-events:none;
        }
        .login-showcase > *{position:relative;z-index:1}
        .login-card{animation:loginCardIn .5s cubic-bezier(.22,1,.36,1) both}
        .login-brand,.login-headline{animation:loginTextRise .55s cubic-bezier(.22,1,.36,1) both}
        .login-headline{animation-delay:.08s}
        @keyframes loginAurora{
          from{transform:rotate(0deg) scale(1)}
          to{transform:rotate(360deg) scale(1)}
        }
        @keyframes loginDotsDrift{
          0%{transform:translate3d(-4px,2px,0);opacity:.48}
          45%{transform:translate3d(10px,-7px,0);opacity:.76}
          100%{transform:translate3d(-7px,8px,0);opacity:.54}
        }
        @keyframes loginCardIn{
          from{opacity:0;transform:translateY(18px) scale(.985)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        @keyframes loginTextRise{
          from{opacity:0;transform:translateY(18px)}
          to{opacity:1;transform:translateY(0)}
        }
        .money-value{display:inline-block;transition:opacity .24s ease, letter-spacing .24s ease, text-shadow .24s ease}
        .money-value[data-private-value="true"]{position:relative;font-variant-numeric:tabular-nums}
        .privacy-mode .money-value[data-private-value="true"]{color:transparent !important;text-shadow:none !important;filter:none !important;user-select:none;pointer-events:none}
        .privacy-mode .money-value[data-private-value="true"]::after{
          content:attr(data-mask);
          position:absolute;
          left:0;
          top:0;
          max-width:100%;
          overflow:hidden;
          white-space:nowrap;
          color:var(--text);
          text-shadow:none;
          animation:privacyCountdown .42s steps(1,end) both, privacyBounceSettle .42s cubic-bezier(.2,1.45,.35,1), privacyMotionBlur .42s ease-out;
        }
        .privacy-mode .hero-card .money-value[data-private-value="true"]::after{color:#fff}
        .privacy-mode .money-value[data-private-value="true"][data-mask="₺0"]::after{min-width:1.5em}
        @keyframes privacyCountdown{
          0%{content:"₺10.000"}
          8%{content:"₺9.250"}
          16%{content:"₺8.100"}
          24%{content:"₺6.850"}
          32%{content:"₺5.400"}
          40%{content:"₺4.200"}
          48%{content:"₺2.950"}
          56%{content:"₺1.900"}
          66%{content:"₺980"}
          76%{content:"₺420"}
          88%{content:"₺80"}
          100%{content:attr(data-mask)}
        }
        @keyframes privacyBounceSettle{
          0%{opacity:.5;letter-spacing:.045em;transform:translateY(-2px) scale(1.08)}
          28%{opacity:1;letter-spacing:.025em;transform:translateY(1px) scale(.96)}
          58%{letter-spacing:.01em;transform:translateY(0) scale(1.015)}
          100%{opacity:1;letter-spacing:0;transform:translateY(0) scale(1)}
        }
        @keyframes privacyMotionBlur{
          0%{filter:blur(.2px)}
          18%{filter:blur(1.7px)}
          46%{filter:blur(1.1px)}
          72%{filter:blur(.45px)}
          100%{filter:blur(0)}
        }
        .sidebar-item{transition:transform .18s ease, background-color .18s ease, box-shadow .18s ease}
        .sidebar-item:hover{background:rgba(255,255,255,.06);transform:translateX(2px)}
        .panel-row{transition:transform .18s ease, box-shadow .18s ease, background-color .22s ease}
        .panel-row:hover{transform:translateY(-2px) scale(1.003);box-shadow:0 8px 18px rgba(15,23,42,.08)}
        .panel-row-editing{transition:transform .12s ease, box-shadow .12s ease, background-color .12s ease}
        .panel-row-editing .soft-input{animation:editFieldPop .12s ease both}
        .panel-row .row-actions-fade{opacity:0;pointer-events:none;transition:opacity .18s ease}
        .panel-row:hover .row-actions-fade{opacity:1;pointer-events:auto}
        .status-button{transition:transform .18s ease, box-shadow .18s ease, background-color .22s ease, border-color .22s ease, color .22s ease}
        .status-button .status-label{display:block;line-height:1;transform:translateY(.2px)}
        .status-button span:first-child{flex:0 0 auto}
        .status-button:hover{transform:scale(1.015);box-shadow:0 10px 24px rgba(15,23,42,.10)}
        .status-button:active{transform:scale(.985)}
        @keyframes editFieldPop{
          from{opacity:.75;transform:scale(.985)}
          to{opacity:1;transform:scale(1)}
        }
        @media (max-width: 980px){
          .app-shell{grid-template-columns:1fr !important}
          .app-sidebar{position:static !important;height:auto !important;min-height:auto !important;padding-bottom:12px !important}
          .sidebar-tabs{gap:6px !important}
          .sidebar-bottom{margin-top:10px !important;padding-top:10px !important}
          .panel-row .row-actions-fade{opacity:1 !important;pointer-events:auto !important}
          .app-content{padding:16px !important}
          .form-layout{grid-template-columns:1fr !important}
          .app-top-bar{flex-direction:column !important;align-items:stretch !important}
          .top-search{width:100% !important;min-width:0 !important}
          .hero-card{padding:16px !important}
          .stats-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
          .quick-grid{grid-template-columns:1fr !important}
          .login-wrap{padding:16px !important}
          .login-shell{display:block !important;grid-template-columns:1fr !important;min-height:auto !important;max-width:760px !important;width:100% !important;background:transparent !important;box-shadow:none !important}
          .login-showcase{display:none !important}
          .login-card{max-width:none !important;border-radius:22px !important;width:100% !important}
        }
        @media (max-width: 720px){
          .app-content{padding:12px !important}
          .hero-card{border-radius:14px !important}
          .hero-value{font-size:32px !important}
          .hero-actions{justify-content:flex-start !important}
          .login-wrap{padding:12px !important}
          .login-shell{grid-template-columns:1fr !important;border-radius:20px !important;max-width:440px !important;min-height:auto !important}
          .login-showcase{display:none !important}
          .login-card{padding:24px 18px !important;max-width:none !important;width:100% !important}
          .login-card-title{font-size:28px !important;letter-spacing:-0.4px !important;margin-bottom:2px !important}
          .login-section{gap:8px !important}
          .login-label{font-size:11px !important}
          .login-meta-row{margin-top:2px !important;gap:8px !important}
          .remember-me-label,.forgot-link{font-size:12px !important}
          .login-signup-block{display:none !important}
          .stats-grid{grid-template-columns:1fr !important}
          .quick-grid{gap:10px !important}
        }
        @media (max-width: 560px){
          .app-sidebar{padding:14px !important}
          .app-sidebar > :first-child{display:none !important}
          .sidebar-bottom{border-top:none !important;padding-top:6px !important}
          .app-content{padding:10px !important;padding-bottom:calc(92px + env(safe-area-inset-bottom, 0px)) !important}
          .app-top-bar{flex-direction:row !important;align-items:center !important;justify-content:flex-end !important;gap:8px !important;margin-bottom:8px !important}
          .top-search{width:40px !important;min-width:40px !important;height:40px !important;padding:0 !important;justify-content:center !important;border-radius:12px !important}
          .top-search input{display:none !important}
          .mobile-top-actions{display:flex !important;width:100% !important;justify-content:flex-end !important;gap:8px !important}
          .mobile-top-actions .top-action-btn,.mobile-top-actions .top-search{width:38px !important;height:38px !important;min-width:38px !important;border-radius:14px !important}
          .page-title{font-size:22px !important;line-height:1.05 !important}
          .page-subtitle{font-size:11px !important;margin-top:4px !important;max-width:220px !important}
          .top-action-btn .btn-label{display:none !important}
          .hero-card{padding:14px !important}
          .hero-value{font-size:28px !important}
          .hero-actions{width:100% !important}
          .hero-top-row{align-items:flex-start !important}
          .hero-export-toggle{padding:8px 10px !important;border-radius:10px !important}
          .hero-export-toggle .hero-export-label{display:none !important}
          .stats-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:8px !important}
          .quick-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:8px !important}
          .quick-grid > div{padding:12px !important;min-height:0 !important}
          .quick-grid > div .quick-title{font-size:14px !important}
          .quick-grid > div .quick-amount{font-size:24px !important}
          .quick-grid > div .quick-muted{font-size:11px !important}
          .mobile-bottom-nav{display:grid !important}
          .mobile-projects-sheet{display:block !important}
          .login-wrap{padding:0 !important}
          .login-shell{border-radius:0 !important;box-shadow:none !important;min-height:100svh !important;max-width:100% !important;background:transparent !important}
          .login-card{padding:16px 14px !important;justify-content:flex-start !important;min-height:100svh !important;border-radius:0 !important;box-shadow:none !important}
          .mobile-auth-wrap{background:#F6F7FC !important}
          .mobile-auth-intro{padding:30px 22px 24px !important}
          .mobile-auth-cta{margin-top:28px !important}
          .login-card-title{font-size:24px !important;line-height:1.05 !important}
          .login-section{gap:7px !important}
          .login-input,.soft-input{font-size:16px !important}
          .login-meta-row{align-items:flex-start !important}
          .remember-me-label{gap:6px !important}
          .mobile-settings-top-actions{display:flex !important}
        }
        @media (max-width: 420px){
          .login-card{padding:16px 12px !important}
          .login-card-title{font-size:22px !important}
          .login-meta-row{flex-wrap:wrap !important}
        }
        @media print{
          .privacy-mode .money-value{filter:none !important;opacity:1 !important}
          .privacy-mode .money-value[data-private-value="true"]{color:inherit !important}
          .privacy-mode .money-value[data-private-value="true"]::after{content:none !important}
          *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important}
          html,body{background:white !important}
          .no-print{display:none !important}
        }
      `}</style>

      {showCreateProjectModal ? (
        <div style={styles.projectModalOverlay} onClick={() => setShowCreateProjectModal(false)}>
          <div
            style={{
              ...styles.projectModalCard,
              ...(isMobileViewport ? styles.projectModalCardMobile : {}),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.projectModalHead}>
              <div>
                <div style={styles.projectModalTitle}>Yeni Proje</div>
                <div style={styles.projectModalHint}>
                  Proje adını belirle, istersen ilk kaydı da aynı anda oluştur.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(false)}
                style={styles.secondaryBtn}
              >
                Kapat
              </button>
            </div>

            <div
              style={{
                ...styles.projectModalGrid,
                ...(isMobileViewport ? styles.projectModalGridMobile : {}),
              }}
            >
              <div style={{ ...styles.formSection, ...styles.projectModalSection }}>
                <div style={styles.formSectionTitle}>Proje Bilgileri</div>
                <div style={{ ...styles.formGrid, gridTemplateColumns: "1fr" }}>
                  <input
                    className="soft-input"
                    placeholder="Proje adı"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    style={styles.input}
                    autoFocus
                  />

                  <div style={styles.projectColorPicker}>
                    {PROJECT_MODAL_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProjectColor(color)}
                        style={{
                          ...styles.projectColorSwatch,
                          background: color,
                          boxShadow:
                            newProjectColor === color
                              ? "0 0 0 3px rgba(37,99,235,.18)"
                              : undefined,
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...styles.formSection, ...styles.projectModalSection }}>
                <div style={styles.formSectionTitle}>İsteğe Bağlı İlk Kayıt</div>
                <div style={styles.formGrid}>
                  <input
                    className="soft-input"
                    placeholder="İlk kayıt adı"
                    value={newProjectFirstItem}
                    onChange={(e) => setNewProjectFirstItem(e.target.value)}
                    style={styles.input}
                  />
                  <input
                    className="soft-input"
                    placeholder="Tutar"
                    value={newProjectAmount}
                    onChange={(e) => setNewProjectAmount(e.target.value)}
                    style={styles.input}
                  />
                  <input
                    className="soft-input"
                    type="date"
                    value={newProjectDate}
                    onChange={(e) => setNewProjectDate(e.target.value)}
                    style={styles.input}
                  />
                  <select
                    className="soft-input"
                    value={taxModeFromFlags(newProjectKdvli, newProjectGvkli)}
                    onChange={(e) => {
                      const next = taxFlagsFromMode(e.target.value);
                      setNewProjectKdvli(next.kdvli);
                      setNewProjectGvkli(next.gvkli);
                    }}
                    style={styles.input}
                  >
                    <option value="none">Vergisiz</option>
                    <option value="kdv">+ %20 KDV</option>
                    <option value="gvk">- %15 GVK</option>
                    <option value="kdv_gvk">+ %20 KDV / - %15 GVK</option>
                  </select>
                </div>

                <div style={styles.projectModalToggleGrid}>
                  <button
                    type="button"
                    onClick={() => setNewProjectInvoice((prev) => !prev)}
                    style={{
                      ...styles.statusToggle,
                      ...styles.projectModalToggle,
                      ...(newProjectInvoice ? styles.statusToggleActive : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.statusToggleTrack,
                        ...(newProjectInvoice ? styles.statusToggleTrackActive : {}),
                      }}
                    >
                      <span
                        style={{
                          ...styles.statusToggleThumb,
                          ...(newProjectInvoice ? styles.statusToggleThumbActive : {}),
                        }}
                      />
                    </span>
                    <span style={styles.statusToggleInfo}>
                      <span
                        style={{
                          ...styles.statusToggleIconWrap,
                          ...(newProjectInvoice
                            ? styles.statusToggleIconWrapAmber
                            : styles.statusToggleIconWrapMuted),
                        }}
                      >
                        <Receipt size={14} />
                      </span>
                      <span style={{ ...styles.statusToggleLabel, ...styles.projectModalToggleLabel }}>
                        Fatura Kesildi
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !newProjectPaid;
                      setNewProjectPaid(next);
                      if (next) setNewProjectInvoice(true);
                    }}
                    style={{
                      ...styles.statusToggle,
                      ...styles.projectModalToggle,
                      ...(newProjectPaid ? styles.statusToggleActive : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.statusToggleTrack,
                        ...(newProjectPaid ? styles.statusToggleTrackActive : {}),
                      }}
                    >
                      <span
                        style={{
                          ...styles.statusToggleThumb,
                          ...(newProjectPaid ? styles.statusToggleThumbActive : {}),
                        }}
                      />
                    </span>
                    <span style={styles.statusToggleInfo}>
                      <span
                        style={{
                          ...styles.statusToggleIconWrap,
                          ...(newProjectPaid
                            ? styles.statusToggleIconWrapTeal
                            : styles.statusToggleIconWrapMuted),
                        }}
                      >
                        <CheckCircle2 size={14} />
                      </span>
                      <span style={{ ...styles.statusToggleLabel, ...styles.projectModalToggleLabel }}>
                        Ödeme Alındı
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.projectModalActions}>
              <button
                type="button"
                onClick={yeniProjeKaydet}
                style={styles.primaryBtn}
              >
                Projeyi Oluştur
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div style={styles.shell} className="app-shell">
        {!isMobileViewport ? (
        <DesktopSidebar
          styles={styles}
          authEmail={authEmail}
          viewMode={viewMode}
          setViewMode={setViewMode}
          setSelectedIds={setSelectedIds}
          yeniProjeOlustur={yeniProjeOlustur}
          gorunenSekmeler={gorunenSekmeler}
          tabMeta={tabMeta}
          aktifSekme={aktifSekme}
          openProjectTab={openProjectTab}
          setTabMenu={setTabMenu}
          showArchivedTabs={showArchivedTabs}
          setShowArchivedTabs={setShowArchivedTabs}
        />
        ) : null}

        <main style={styles.content} className="app-content" ref={exportRef}>
            <div
              style={{
                ...styles.topBar,
                ...(isMobileViewport
                  ? { justifyContent: "flex-end", minHeight: 0, marginBottom: 0 }
                  : {}),
              }}
              className="app-top-bar"
            >
              {!isMobileViewport ? (
                <div>
                  <h1 style={styles.pageTitle} className="page-title">
                    {viewMode === "home"
                      ? "Ana Sayfa"
                      : viewMode === "settings"
                        ? "Hesap Ayarları"
                        : aktifSekme || "Proje"}
                  </h1>
                  <div style={styles.pageSubtitle} className="page-subtitle">
                    {viewMode === "home"
                      ? "Tahsilat ve fatura takibinin genel özeti"
                      : viewMode === "settings"
                        ? "Profil, güvenlik ve hesap işlemleri"
                        : "Sekme detayları"}
                  </div>
                </div>
              ) : null}

              <div style={isMobileViewport ? styles.mobileTopActions : styles.topBarActions}>
                {viewMode !== "settings" ? (
                  isMobileViewport ? (
                    <button
                      type="button"
                      className="hover-button top-search"
                      style={styles.mobileSearchToggle}
                      onClick={() => setShowMobileSearch((prev) => !prev)}
                      aria-label="Ara"
                      title="Ara"
                    >
                      <Search size={16} color={palette.muted} />
                    </button>
                  ) : (
                    <div style={styles.topSearchWrap} className="top-search">
                      <Search size={15} color={palette.muted} />
                      <input
                        className="soft-input"
                        placeholder="Ara"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSelectedIds([]);
                        }}
                        style={styles.topSearchInput}
                      />
                    </div>
                  )
                ) : null}
              <button
                className="hover-button top-action-btn"
                onClick={() =>
                  setTheme((p) => (p === "light" ? "dark" : "light"))
                }
                style={isMobileViewport ? styles.mobileTopIconBtn : styles.secondaryBtn}
              >
                <span style={styles.btnInner}>
                  {theme === "light" ? <Moon size={16} /> : <SunMedium size={16} />}
                  {isMobileViewport ? null : (
                    <span className="btn-label">
                      {theme === "light" ? "Karanlık Tema" : "Açık Tema"}
                    </span>
                  )}
                </span>
              </button>

              <button
                className="hover-button top-action-btn"
                onClick={() => setPrivacyMode((prev) => !prev)}
                style={isMobileViewport ? styles.mobileTopIconBtn : styles.secondaryBtn}
                title={privacyMode ? "Rakamları göster" : "Rakamları gizle"}
                aria-label={privacyMode ? "Rakamları göster" : "Rakamları gizle"}
              >
                <span style={styles.btnInner}>
                  {privacyMode ? <Eye size={16} /> : <EyeOff size={16} />}
                  {isMobileViewport ? null : (
                    <span className="btn-label">
                      Gizle
                    </span>
                  )}
                </span>
              </button>

              <button
                className="hover-button top-action-btn"
                onClick={() => void cikisYap()}
                style={isMobileViewport ? styles.mobileTopIconBtn : styles.secondaryBtn}
              >
                <span style={styles.btnInner}>
                  <LogOut size={16} />
                  {isMobileViewport ? null : <span className="btn-label">Çıkış Yap</span>}
                </span>
              </button>
            </div>
          </div>

          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await uploadProfilePhoto(file);
              }
              e.currentTarget.value = "";
            }}
          />

            {viewMode === "settings" ? (
              <>
                {renderSettingsContent()}
              </>
            ) : (
              <div className={`view-panel view-panel-${viewMode}`}>
            <DashboardHero
              styles={styles}
              isMobileViewport={isMobileViewport}
              viewMode={viewMode}
              theme={theme}
              toplam={tumToplam}
              odenen={tumOdenenTutar}
              kalan={tumKalanTutar}
              exportMenuRef={exportMenuRef}
              exportMenuOpen={exportMenuOpen}
              onToggleExportMenu={() => setExportMenuOpen((prev) => !prev)}
              onExportWord={() => {
                exportWord();
                setExportMenuOpen(false);
              }}
              onExportExcel={() => {
                exportExcel();
                setExportMenuOpen(false);
              }}
              onExportPdf={() => {
                void exportPDF();
                setExportMenuOpen(false);
              }}
              onToggleSearch={() => setShowMobileSearch((prev) => !prev)}
              onTogglePrivacy={() => setPrivacyMode((prev) => !prev)}
              onToggleTheme={() => setTheme((p) => (p === "light" ? "dark" : "light"))}
              onSignOut={() => void cikisYap()}
              privacyMode={privacyMode}
            />

                <input
                  ref={invoiceInputRef}
                  type="file"
                  accept={INVOICE_FILE_ACCEPT}
                  style={{ display: "none" }}
                  onChange={async (e) => {
                const file = e.target.files?.[0];
                const row =
                  invoiceTargetId === null
                    ? null
                    : data.find((item) => item.id === invoiceTargetId) || null;

                if (file && row) {
                  await uploadInvoice(row, file);
                }

                setInvoiceTargetId(null);
                e.currentTarget.value = "";
              }}
            />

            <SummaryStatsGrid
              styles={styles}
              viewMode={viewMode}
              filteredHomeRowsLength={filteredHomeRows.length}
              filteredActiveRowsLength={filteredActiveKayitlar.length}
              homeSummary={{
                tumOdeme,
                tumFatura,
                toplam: tumToplam,
              }}
              projectSummary={{
                odemesiAlinanAdet,
                faturasiKesilenAdet,
                kalan,
              }}
              activeTabMeta={aktifTabMeta}
              palette={palette}
            />

            <SummaryQuickPanels
              styles={styles}
              viewMode={viewMode}
              homeProjectStats={homeProjectStats}
              filteredHomeRowsLength={filteredHomeRows.length}
              filteredActiveRowsLength={filteredActiveKayitlar.length}
              tumOdeme={tumOdeme}
              tumFatura={tumFatura}
              tumOdenenTutar={tumOdenenTutar}
              tumKalanTutar={tumKalanTutar}
              tahsilatYuzdesiGenel={tahsilatYuzdesiGenel}
              toplam={toplam}
              tahsilatYuzdesiAktif={tahsilatYuzdesiAktif}
              odenen={odenen}
              kalan={kalan}
              odemesiAlinanAdet={odemesiAlinanAdet}
              faturasiKesilenAdet={faturasiKesilenAdet}
              selectedVisibleIdsLength={selectedVisibleIds.length}
              aktifTabMeta={aktifTabMeta}
            />

          {viewMode === "home" ? (
            <div style={styles.card} className="content-card">
              <div style={styles.sectionHead}>
                <h2 style={{ ...styles.h2, fontWeight: 900 }}>Genel Proje Özeti</h2>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {homeProjectStats.length} proje
                </div>
              </div>

              {homeProjectStats.length === 0 ? (
                <EmptyStateCard
                  title="Henüz proje görünmüyor"
                  description="İlk projeni oluşturduğunda genel özet burada listelenecek."
                  actionLabel="Yeni Proje"
                  onAction={yeniProjeOlustur}
                  styles={styles}
                />
              ) : (
              isMobileViewport ? (
              <div style={styles.mobileHomeSummaryList}>
                {homeProjectStats.map((item) => {
                  const meta = tabMeta[item.tab] || { color: palette.blue };

                  return (
                    <button
                      key={item.tab}
                      type="button"
                      className="hover-button"
                      style={{
                        ...styles.mobileHomeSummaryCard,
                        borderLeft: `4px solid ${meta.color}`,
                      }}
                      onClick={() => openProjectTab(item.tab)}
                    >
                      <div style={styles.mobileHomeSummaryHead}>
                        <strong style={styles.mobileHomeSummaryTitle}>{item.tab}</strong>
                        <span
                          style={styles.mobileHomeSummaryAmount}
                          className="money-value"
                          data-private-value="true"
                          data-mask="₺0"
                        >
                          {tl(item.toplam)}
                        </span>
                      </div>
                      <div style={styles.mobileHomeSummaryMeta}>
                        <span>{item.kayit} kayıt</span>
                        <span>{item.odenen} ödeme</span>
                        <span>{item.fatura} fatura</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {homeProjectColumns.map((column) => {
                        const isColumnTarget =
                          dragOverHomeColumn === column.key &&
                          draggedHomeColumn !== null &&
                          draggedHomeColumn !== column.key;

                        return (
                          <th
                            key={column.key}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", column.key);
                              draggedHomeColumnRef.current = column.key;
                              setDraggedHomeColumn(column.key);
                            }}
                            onDragEnd={() => {
                              draggedHomeColumnRef.current = null;
                              setDraggedHomeColumn(null);
                              setDragOverHomeColumn(null);
                            }}
                            onDragOver={(e) => handleHomeColumnDragOver(e, column.key)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const payload = e.dataTransfer.getData("text/plain");
                              const sourceColumn =
                                draggedHomeColumnRef.current ??
                                draggedHomeColumn ??
                                (isHomeProjectColumnKey(payload) ? payload : null);

                              if (sourceColumn) {
                                moveHomeProjectColumn(
                                  sourceColumn,
                                  column.key,
                                  homeColumnDropPosition
                                );
                              }
                              draggedHomeColumnRef.current = null;
                              setDraggedHomeColumn(null);
                              setDragOverHomeColumn(null);
                            }}
                            style={{
                              ...column.style,
                              cursor: "grab",
                              borderLeft:
                                isColumnTarget && homeColumnDropPosition === "before"
                                  ? "4px solid var(--blue)"
                                  : undefined,
                              borderRight:
                                isColumnTarget && homeColumnDropPosition === "after"
                                  ? "4px solid var(--blue)"
                                  : undefined,
                              opacity:
                                draggedHomeColumn === column.key ? 0.55 : column.style.opacity,
                            }}
                            title="Sürükleyerek yer değiştir"
                          >
                            {column.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {homeProjectStats.map((item) => {
                      const meta = tabMeta[item.tab] || { color: palette.blue };

                      return (
                        <tr key={item.tab}>
                          {homeProjectColumnOrder.map((column) => {
                            if (column === "proje") {
                              return (
                                <td
                                  key={column}
                                  style={{ ...styles.td, borderLeft: `5px solid ${meta.color}` }}
                                >
                                  {item.tab}
                                </td>
                              );
                            }

                            if (column === "kayit") {
                              return (
                                <td key={column} style={styles.td}>
                                  {item.kayit}
                                </td>
                              );
                            }

                            if (column === "odeme") {
                              return (
                                <td key={column} style={styles.td}>
                                  {item.odenen}
                                </td>
                              );
                            }

                            if (column === "fatura") {
                              return (
                                <td key={column} style={styles.td}>
                                  {item.fatura}
                                </td>
                              );
                            }

                            return (
                              <td key={column} style={{ ...styles.td, fontWeight: 700 }}>
                                <span
                                  className="money-value"
                                  data-private-value="true"
                                  data-mask="₺0"
                                >
                                  {tl(item.toplam)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )
              )}
            </div>
          ) : (
            <>
              <div
                style={styles.card}
                className="content-card"
                data-inline-edit-row={editId !== null ? "true" : undefined}
              >
                <div style={styles.sectionHead}>
                  <h2 style={styles.h2}>Kayıt Ekle / Güncelle</h2>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    Taslak otomatik kaydediliyor
                  </div>
                </div>

<div style={styles.formLayout} className="form-layout">
                  <div style={styles.formSection}>
                    <div style={styles.formSectionTitle}>Genel Bilgiler</div>
                    <div style={styles.formGrid}>
                      <input
                        className="soft-input"
                        placeholder="PROJE"
                        value={proje}
                        onChange={(e) => {
                          const value = e.target.value;
                          setProje(value);
                          updateDraftField({ proje: value });
                        }}
                        style={styles.input}
                      />

                      <input
                        className="soft-input"
                        placeholder="Tutar"
                        value={tutar}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTutar(value);
                          updateDraftField({ tutar: value });
                        }}
                        style={styles.input}
                      />

                      <select
                        className="soft-input"
                        value={taxModeFromFlags(kdvli, gvkli)}
                        onChange={(e) => {
                          const next = taxFlagsFromMode(e.target.value);
                          setKdvli(next.kdvli);
                          setGvkli(next.gvkli);
                          updateDraftField(next);
                        }}
                        style={styles.input}
                      >
                        <option value="none">Vergisiz</option>
                        <option value="kdv">+ %20 KDV</option>
                        <option value="gvk">- %15 GVK</option>
                        <option value="kdv_gvk">+ %20 KDV / - %15 GVK</option>
                      </select>

                      <input
                        className="soft-input"
                        type="date"
                        value={tarih}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTarih(value);
                          updateDraftField({ tarih: value });
                        }}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formSection}>
                    <div style={styles.formSectionTitle}>Durum ve İşlem</div>
                    <div style={styles.formChecks}>
                      <button
                        type="button"
                        onClick={() => {
                          const nextValue = !faturaKesildi;
                          setFaturaKesildi(nextValue);
                          updateDraftField({ faturaKesildi: nextValue });
                        }}
                        style={{
                          ...styles.statusToggle,
                          ...(faturaKesildi ? styles.statusToggleActive : {}),
                        }}
                      >
                        <span
                          style={{
                            ...styles.statusToggleTrack,
                            ...(faturaKesildi ? styles.statusToggleTrackActive : {}),
                          }}
                        >
                          <span
                            style={{
                              ...styles.statusToggleThumb,
                              ...(faturaKesildi ? styles.statusToggleThumbActive : {}),
                            }}
                          />
                        </span>
                        <span style={styles.statusToggleInfo}>
                          <span
                            style={{
                              ...styles.statusToggleIconWrap,
                              ...(faturaKesildi
                                ? styles.statusToggleIconWrapAmber
                                : styles.statusToggleIconWrapMuted),
                            }}
                          >
                            <Receipt size={14} />
                          </span>
                          <span style={styles.statusToggleLabel}>Fatura Kesildi</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextValue = !odemeAlindi;
                          const nextFaturaKesildi = nextValue ? true : faturaKesildi;
                          setOdemeAlindi(nextValue);
                          setFaturaKesildi(nextFaturaKesildi);
                          updateDraftField({
                            odemeAlindi: nextValue,
                            faturaKesildi: nextFaturaKesildi,
                          });
                        }}
                        style={{
                          ...styles.statusToggle,
                          ...(odemeAlindi ? styles.statusToggleActive : {}),
                        }}
                      >
                        <span
                          style={{
                            ...styles.statusToggleTrack,
                            ...(odemeAlindi ? styles.statusToggleTrackActive : {}),
                          }}
                        >
                          <span
                            style={{
                              ...styles.statusToggleThumb,
                              ...(odemeAlindi ? styles.statusToggleThumbActive : {}),
                            }}
                          />
                        </span>
                        <span style={styles.statusToggleInfo}>
                          <span
                            style={{
                              ...styles.statusToggleIconWrap,
                              ...(odemeAlindi
                                ? styles.statusToggleIconWrapTeal
                                : styles.statusToggleIconWrapMuted),
                            }}
                          >
                            <CheckCircle2 size={14} />
                          </span>
                          <span style={styles.statusToggleLabel}>Ödeme Alındı</span>
                        </span>
                      </button>
                    </div>

                    <div style={styles.formActions}>
                      <button
                        className="hover-button"
                        onClick={kaydet}
                        style={styles.primaryBtn}
                      >
                        <span style={styles.btnInner}>
                          <Plus size={16} />
                          {editId ? "Güncelle" : "Kaydet"}
                        </span>
                      </button>

                      {editId ? (
                        <button
                          className="hover-button"
                          onClick={temizle}
                          style={styles.secondaryBtn}
                        >
                          İptal
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {msg ? <div style={styles.msg}>{msg}</div> : null}

              {lastDeleted?.length ? (
                <div style={styles.undoBar} className="no-print">
                  <span>{lastDeleted.length} kayıt silindi.</span>
                  <button
                    className="hover-button"
                    onClick={() => void undoDelete()}
                    style={styles.secondaryBtn}
                  >
                    <span style={styles.btnInner}>
                      <RotateCcw size={16} />
                      Geri Al
                    </span>
                  </button>
                </div>
              ) : null}

              <div style={styles.card} className="content-card" ref={projectPdfRef}>
                <div
                  style={
                    isMobileViewport
                      ? styles.mobileProjectSummaryStrip
                      : {
                          display: "flex",
                          gap: 12,
                          marginBottom: 14,
                          flexWrap: "wrap",
                        }
                  }
                >
                  <div
                    style={
                      isMobileViewport ? styles.mobileProjectSummaryCard : styles.miniSoft
                    }
                  >
                    <div style={styles.miniLabel}>Ara Toplam</div>
                    <AnimatedMoney value={toplam} />
                  </div>

                  <div
                    style={
                      isMobileViewport
                        ? styles.mobileProjectSummaryCardActive
                        : styles.miniHighlight
                    }
                  >
                    <div style={styles.miniLabelStrong}>Ödenen</div>
                    <AnimatedMoney value={odenen} strong />
                  </div>

                  <div
                    style={
                      isMobileViewport ? styles.mobileProjectSummaryCard : styles.miniSoft
                    }
                  >
                    <div style={styles.miniLabel}>Kalan</div>
                    <AnimatedMoney value={kalan} />
                  </div>
                </div>

                <div style={styles.sectionHead}>
                  <h2 style={styles.h2}>Kayıtlar</h2>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {sortKey === "manual"
                      ? "SIRA alanından sürükle bırak yap"
                      : "Başlığa tıklayarak sıralama değişir"}
                  </div>
                </div>

                {draggedId !== null && sortKey === "manual" ? (
                  <div style={styles.dragNotice} className="no-print">
                    Kaydı bırakacağın satır mavi çizgiyle işaretlenir. Üst çizgi üste, alt çizgi alta bırakır.
                  </div>
                ) : null}

                {filteredActiveKayitlar.length === 0 ? (
                  <EmptyStateCard
                    title="Bu projede kayıt yok"
                    description="İlk kaydı formdan ekleyebilir veya mevcut filtreleri temizleyebilirsin."
                    actionLabel="Yeni Kayıt Hazırla"
                    onAction={temizle}
                    styles={styles}
                  />
                ) : isMobileViewport ? (
                  <MobileProjectCards
                    rows={filteredActiveKayitlar}
                    invoiceMap={invoiceMap}
                    rowMeta={rowMeta}
                    aktifTabMeta={aktifTabMeta}
                    styles={styles}
                    shortDate={shortDate}
                    shortDateTime={shortDateTime}
                    tl={tl}
                    durumGorunum={durumGorunum}
                    durumIlerle={durumIlerle}
                    editAc={editAc}
                    kayitSil={kayitSil}
                    openInvoicePicker={openInvoicePicker}
                    uploadingInvoiceId={uploadingInvoiceId}
                  />
                ) : (
                  <div
                    style={{
                      ...styles.tableWrap,
                      ...(draggedId !== null && sortKey === "manual"
                        ? styles.tableWrapDragging
                        : null),
                    }}
                  >
                    {draggedId !== null && sortKey === "manual" ? (
                      <div style={styles.dragOverlay} />
                    ) : null}

                    <table style={styles.tableBig}>
                    <thead>
                      <tr>
                        {projectColumns.map((column) => {
                          const isColumnTarget =
                            dragOverColumn === column.key &&
                            draggedColumn !== null &&
                            draggedColumn !== column.key;

                          return (
                            <th
                              key={column.key}
                              draggable
                              className={column.className}
                              onClick={column.onClick}
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", column.key);
                                draggedColumnRef.current = column.key;
                                setDraggedColumn(column.key);
                              }}
                              onDragEnd={() => {
                                draggedColumnRef.current = null;
                                setDraggedColumn(null);
                                setDragOverColumn(null);
                              }}
                              onDragOver={(e) => handleColumnDragOver(e, column.key)}
                              onDrop={(e) => {
                                e.preventDefault();
                                const payload = e.dataTransfer.getData("text/plain");
                                const sourceColumn =
                                  draggedColumnRef.current ??
                                  draggedColumn ??
                                  (isProjectColumnKey(payload) ? payload : null);

                                if (sourceColumn) {
                                  moveProjectColumn(
                                    sourceColumn,
                                    column.key,
                                    columnDropPosition
                                  );
                                }
                                draggedColumnRef.current = null;
                                setDraggedColumn(null);
                                setDragOverColumn(null);
                              }}
                              style={{
                                ...column.style,
                                position: "relative",
                                borderLeft:
                                  isColumnTarget && columnDropPosition === "before"
                                    ? "4px solid var(--blue)"
                                    : undefined,
                                borderRight:
                                  isColumnTarget && columnDropPosition === "after"
                                    ? "4px solid var(--blue)"
                                    : undefined,
                                opacity:
                                  draggedColumn === column.key ? 0.55 : column.style.opacity,
                              }}
                              title="Sürükleyerek yer değiştir"
                            >
                              {column.label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredActiveKayitlar.map((row) => {
                        const durum = durumGorunum(row);
                        const editing = editId === row.id;
                        const meta = rowMeta[row.id];
                        const invoices = invoiceMap[row.id] || [];
                        const isDragSource = draggedId === row.id;
                        const isDropTarget =
                          dragOverId === row.id && draggedId !== null && draggedId !== row.id;

                        return (
                          <tr
                            key={row.id}
                            className={`panel-row${editing ? " panel-row-editing" : ""}`}
                            data-inline-edit-row={editing ? "true" : undefined}
                            onDragOver={(e) => handleRowDragOver(e, row.id)}
                            onDragLeave={() => {
                              if (dragOverId === row.id) {
                                setDragOverId(null);
                              }
                            }}
                            onDrop={async () => {
                              if (sortKey === "manual" && draggedId) {
                                await satirTasi(draggedId, row.id, dropPosition);
                              }
                              setDraggedId(null);
                              setDragOverId(null);
                            }}
                            style={{
                              background: durum.rowBg,
                              opacity:
                                draggedId !== null && !isDragSource && !isDropTarget ? 0.38 : 1,
                              filter:
                                draggedId !== null && !isDragSource && !isDropTarget
                                  ? "grayscale(.08) brightness(.92)"
                                  : undefined,
                              transform: isDragSource
                                ? "scale(0.975)"
                                : isDropTarget
                                  ? "scale(1.01)"
                                  : "none",
                              boxShadow: isDropTarget
                                ? "0 0 0 3px rgba(37,99,235,.35), 0 24px 48px rgba(37,99,235,.22)"
                                : editing
                                  ? "0 0 0 2px rgba(37,99,235,.18), 0 14px 34px rgba(37,99,235,.12)"
                                  : undefined,
                              position: "relative",
                              zIndex: isDropTarget || isDragSource ? 2 : 1,
                              borderTop:
                                isDropTarget && dropPosition === "before"
                                  ? "6px solid var(--blue)"
                                  : undefined,
                              borderBottom:
                                isDropTarget && dropPosition === "after"
                                  ? "6px solid var(--blue)"
                                  : undefined,
                            }}
                          >
                            {projectColumnOrder.map((column) =>
                              renderProjectCell(column, row, {
                                durum,
                                editing,
                                meta,
                                invoices,
                                isDragSource,
                              })
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* legacy empty-state block removed
                    <div
                      style={{
                        color: "var(--muted)",
                        paddingTop: 10,
                        fontSize: 13,
                      }}
                    >
                      Filtreye uygun kayıt yok.
                    </div>
                  */}
                </div>
                )}
              </div>
            </>
          )}

            </div>
          )}

          {loading ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Veriler yükleniyor...
            </div>
          ) : null}
        </main>
      </div>

      {isMobileViewport ? (
        <MobileNavigation
          styles={styles}
          showMobileProjects={showMobileProjects}
          setShowMobileProjects={setShowMobileProjects}
          showArchivedTabs={showArchivedTabs}
          setShowArchivedTabs={setShowArchivedTabs}
          gorunenSekmeler={gorunenSekmeler}
          tabMeta={tabMeta}
          viewMode={viewMode}
          aktifSekme={aktifSekme}
          openProjectTab={openProjectTab}
          setViewMode={setViewMode}
          setSelectedIds={setSelectedIds}
          yeniProjeOlustur={yeniProjeOlustur}
          showMobileSearch={showMobileSearch}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          mutedColor={palette.muted}
        />
      ) : null}

      {tabMenu.visible ? (
        <div
          style={{
            position: "fixed",
            top: tabMenu.y,
            left: tabMenu.x,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            padding: 6,
            zIndex: 9999,
            minWidth: 190,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {tabMenu.mode === "menu" ? (
            <>
              <button
                className="hover-button"
                style={styles.contextBtn}
                onClick={async () => {
                  setTabMenu((p) => ({ ...p, visible: false }));
                  await sekmeYenidenAdlandir(tabMenu.tabName);
                }}
              >
                <span style={styles.btnInner}>
                  <Pencil size={14} />
                  Ad Değiştir
                </span>
              </button>

              <button
                className="hover-button"
                style={styles.contextBtn}
                onClick={() => {
                  sekmeGorunumDuzenle(tabMenu.tabName);
                }}
              >
                <span style={styles.btnInner}>
                  <Palette size={14} />
                  Renk Seç
                </span>
              </button>

              <button
                className="hover-button"
                style={styles.contextBtn}
                onClick={() => {
                  setTabMenu((p) => ({ ...p, visible: false }));
                  sekmeArsivDurumunuDegistir(tabMenu.tabName);
                }}
              >
                <span style={styles.btnInner}>
                  <Archive size={14} />
                  {archivedTabs.includes(tabMenu.tabName)
                    ? "Arşivden Çıkar"
                    : "Sekmeyi Arşivle"}
                </span>
              </button>

              <button
                className="hover-button"
                style={{ ...styles.contextBtn, color: "var(--red)" }}
                onClick={async () => {
                  setTabMenu((p) => ({ ...p, visible: false }));
                  await sekmeSil(tabMenu.tabName);
                }}
              >
                <span style={styles.btnInner}>
                  <Trash2 size={14} />
                  Sekmeyi Sil
                </span>
              </button>
            </>
          ) : (
            <div style={styles.colorPickerWrap}>
              <div style={styles.colorPickerHead}>
                <div style={styles.colorPickerTitle}>Renk Seç</div>
                <button
                  type="button"
                  style={styles.colorPickerBackBtn}
                  onClick={() => setTabMenu((prev) => ({ ...prev, mode: "menu" }))}
                >
                  Geri
                </button>
              </div>

              <div style={styles.colorPickerGrid}>
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setTabMeta((prev) => ({
                        ...prev,
                        [tabMenu.tabName]: {
                          color,
                        },
                      }));
                      setTabMenu((prev) => ({ ...prev, visible: false, mode: "menu" }));
                    }}
                    style={{
                      ...styles.colorSwatch,
                      background: color,
                      boxShadow:
                        (tabMeta[tabMenu.tabName]?.color || "") === color
                          ? "0 0 0 3px rgba(37,99,235,.22)"
                          : undefined,
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, var(--appBg) 0%, var(--sidebarBg) 100%)",
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", Arial, sans-serif',
    fontVariantNumeric: "tabular-nums",
  },
  shell: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "206px 1fr",
  },
  sidebar: {
    background: "var(--sidebarBg)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    borderRight: "1px solid rgba(148,163,184,0.10)",
    minHeight: "100vh",
  },
  sidebarTitle: {
    color: "var(--white)",
    fontSize: 17,
    fontWeight: 750,
  },
  sidebarSub: {
    color: "#93A4BA",
    fontSize: 12,
  },
  sidebarTabs: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sidebarIconOnlyBtn: {
    width: 40,
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    margin: "2px auto 6px",
    borderRadius: 12,
    border: "1px dashed rgba(96,165,250,0.34)",
    background: "rgba(255,255,255,0.03)",
    color: "#93C5FD",
    cursor: "pointer",
    padding: 0,
  },
  sidebarIconOnlyInner: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarBottom: {
    marginTop: "auto",
    display: "grid",
    gap: 8,
    paddingTop: 14,
    borderTop: "1px solid rgba(148,163,184,0.08)",
  },
  mobileBottomNav: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "max(10px, env(safe-area-inset-bottom, 0px))",
    minHeight: 58,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) 58px minmax(0, 1fr) minmax(0, 1fr)",
    alignItems: "center",
    padding: "7px 8px",
    borderRadius: 22,
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(148,163,184,0.22)",
    boxShadow: "0 16px 34px rgba(15,23,42,0.12)",
    backdropFilter: "blur(16px)",
    zIndex: 40,
    overflow: "visible",
  },
  mobileNavItem: {
    minHeight: 42,
    border: "none",
    background: "transparent",
    borderRadius: 15,
    color: "var(--muted)",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "0 3px",
    fontSize: 10.5,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  mobileNavUtility: {
    width: 38,
    height: 38,
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    color: "var(--muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  mobileNavItemActive: {
    minHeight: 42,
    border: "none",
    background: "rgba(37,99,235,0.10)",
    borderRadius: 15,
    color: "var(--blue)",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "0 3px",
    fontSize: 10.5,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  mobileNavPlus: {
    width: 56,
    height: 56,
    border: "none",
    borderRadius: 999,
    background: "linear-gradient(180deg, #2563EB 0%, #194AC6 100%)",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    gridColumn: 3,
    justifySelf: "center",
    boxShadow: "0 12px 28px rgba(37,99,235,0.24)",
    marginTop: -8,
  },
  mobileProjectsBackdrop: {
    display: "none",
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.26)",
    transition: "opacity .18s ease",
    zIndex: 39,
  },
  mobileProjectsSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 84,
    borderRadius: 22,
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "0 18px 42px rgba(15,23,42,0.16)",
    padding: 14,
    transition: "transform .18s ease",
  },
  mobileProjectsSheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
    color: "var(--text)",
  },
  mobileProjectsSheetAction: {
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    color: "var(--text)",
    borderRadius: 12,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  mobileProjectsList: {
    display: "grid",
    gap: 8,
    maxHeight: "50vh",
    overflowY: "auto",
  },
  mobileProjectItem: {
    width: "100%",
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    color: "var(--text)",
    borderRadius: 14,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  mobileProjectItemActive: {
    width: "100%",
    border: "1px solid rgba(37,99,235,0.18)",
    background: "rgba(37,99,235,0.08)",
    color: "var(--blue)",
    borderRadius: 14,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    textAlign: "left",
  },
  mobileSearchToggle: {
    width: 40,
    height: 40,
    border: "1px solid var(--border)",
    background: "var(--card)",
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "var(--shadow)",
  },
  mobileSearchPanel: {
    position: "fixed",
    left: 12,
    right: 12,
    top: "calc(env(safe-area-inset-top, 0px) + 58px)",
    zIndex: 45,
    maxWidth: 520,
    margin: "0 auto",
  },
  mobileSearchField: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 14,
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  mobileHomeSummaryList: {
    display: "grid",
    gap: 10,
  },
  mobileHomeSummaryCard: {
    width: "100%",
    border: "1px solid var(--border)",
    background: "var(--card)",
    borderRadius: 16,
    padding: "14px 14px 12px",
    display: "grid",
    gap: 8,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "var(--shadow)",
  },
  mobileHomeSummaryHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  mobileHomeSummaryTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "var(--text)",
  },
  mobileHomeSummaryAmount: {
    fontSize: 14,
    fontWeight: 900,
    color: "var(--textSoft)",
  },
  mobileHomeSummaryMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--muted)",
  },
  sidebarTabInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  tabColorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
    flexShrink: 0,
  },
  tab: {
    width: "100%",
    textAlign: "left",
    padding: "10px 10px 10px 14px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "transparent",
    color: "#D5E0EB",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  activeTab: {
    width: "100%",
    textAlign: "left",
    padding: "10px 10px 10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(96,165,250,0.10)",
    borderLeft: "2px solid var(--blue)",
    background: "rgba(255,255,255,0.03)",
    color: "#8BB7FF",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "none",
  },
  content: {
    background: "var(--contentBg)",
    padding: 20,
    display: "grid",
    gap: 12,
  },
  pageTitle: {
    margin: 0,
    fontSize: 31,
    fontWeight: 850,
    color: "var(--text)",
    letterSpacing: "-0.7px",
    textAlign: "center",
  },
  pageSubtitle: {
    color: "var(--muted)",
    marginTop: 6,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "-0.1px",
    textAlign: "center",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  topBarActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  mobileTopActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    width: "100%",
    flexWrap: "nowrap",
  },
  heroMobileActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  heroMobileIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
    backdropFilter: "blur(10px)",
  },
  mobileSettingsTopActions: {
    display: "none",
    gap: 8,
    marginBottom: 10,
  },
  mobileSettingsTopBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  topSearchWrap: {
    minWidth: 180,
    width: 220,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  topSearchInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
    padding: 0,
  },
  btnInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  heroCard: {
    background: "var(--hero)",
    color: "white",
    padding: 16,
    borderRadius: 15,
    position: "relative",
    zIndex: 2,
    overflow: "visible",
  },
  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  heroExportWrap: {
    position: "relative",
    marginLeft: "auto",
    zIndex: 6,
  },
  heroExportToggle: {
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.12)",
    color: "var(--white)",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(15,23,42,0.14)",
    backdropFilter: "blur(12px)",
  },
  heroExportToggleInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },
  heroExportMenu: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    minWidth: 168,
    padding: 8,
    borderRadius: 14,
    background: "var(--card)",
    border: "1px solid rgba(148,163,184,0.22)",
    boxShadow: "0 18px 42px rgba(15,23,42,0.18)",
    display: "grid",
    gap: 4,
    zIndex: 50,
  },
  heroExportMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    background: "transparent",
    color: "var(--text)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
  },
  heroExportMenuIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroExportMenuIconWord: {
    background: "rgba(88, 130, 255, 0.14)",
    color: "#4E74E6",
  },
  heroExportMenuIconExcel: {
    background: "rgba(36, 182, 117, 0.14)",
    color: "#1D9B66",
  },
  heroExportMenuIconPdf: {
    background: "rgba(237, 94, 94, 0.14)",
    color: "#D95050",
  },
  heroLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: 800,
    letterSpacing: 1,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-0.7px",
    fontVariantNumeric: "tabular-nums",
  },
  heroSubRow: {
    display: "flex",
    gap: 20,
    marginTop: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  heroSubTitle: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: 700,
  },
  heroSubValue: {
    fontSize: 19,
    fontWeight: 800,
    letterSpacing: "-0.3px",
    fontVariantNumeric: "tabular-nums",
  },
  heroDivider: {
    width: 1,
    alignSelf: "stretch",
    background: "rgba(255,255,255,0.22)",
    minHeight: 36,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  stat: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 15,
    boxShadow: "var(--shadow)",
  },
  statBody: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIconBlue: {
    background: "rgba(88, 130, 255, 0.12)",
  },
  statIconTeal: {
    background: "rgba(38, 190, 126, 0.12)",
  },
  statIconAmber: {
    background: "rgba(255, 175, 79, 0.14)",
  },
  statIconRed: {
    background: "rgba(255, 112, 112, 0.12)",
  },
  statCopy: {
    display: "grid",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 600,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 900,
    color: "var(--text)",
    letterSpacing: "-0.4px",
    fontVariantNumeric: "tabular-nums",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
  },
  quickCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "var(--shadow)",
    minHeight: 302,
    display: "flex",
    flexDirection: "column",
  },
  projectSummaryCard: {
    minHeight: 238,
    padding: 18,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "var(--text)",
  },
  quickBig: {
    fontSize: 36,
    fontWeight: 900,
    color: "var(--text)",
    marginTop: 8,
    letterSpacing: "-0.8px",
    fontVariantNumeric: "tabular-nums",
  },
  quickMuted: {
    fontSize: 12,
    color: "var(--muted)",
    marginTop: 4,
  },
  projectSummaryAmount: {
    fontSize: 34,
    fontWeight: 900,
    color: "var(--text)",
    marginTop: 8,
    letterSpacing: "-0.8px",
    fontVariantNumeric: "tabular-nums",
  },
  progressWrap: {
    height: 10,
    background: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 12,
  },
  progressWrapThin: {
    height: 8,
    background: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, var(--blue), var(--teal))",
    borderRadius: 999,
  },
  quickFooterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "var(--text)",
    marginTop: 8,
  },
  projectSummaryRow: {
    marginTop: 10,
  },
  projectInfoList: {
    display: "grid",
    gap: 0,
    marginTop: 12,
  },
  projectInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "11px 0",
    fontSize: 14,
    color: "var(--textSoft)",
    borderBottom: "1px solid rgba(148,163,184,0.16)",
  },
  quickSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: "auto",
    paddingTop: 16,
  },
  quickSummaryItem: {
    border: "1px solid var(--border)",
    borderRadius: 14,
    background: "var(--slateSoft)",
    padding: "12px 14px",
  },
  quickSummaryLabel: {
    fontSize: 11,
    color: "var(--muted)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  quickSummaryValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: 800,
    color: "var(--text)",
    lineHeight: 1.2,
  },
  iconStatGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 12,
  },
  iconStatBox: {
    border: "1px solid var(--border)",
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(255,255,255,0.72), var(--slateSoft))",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
  },
  iconStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconStatNumber: {
    fontSize: 26,
    fontWeight: 900,
    color: "var(--text)",
    letterSpacing: "-0.5px",
    fontVariantNumeric: "tabular-nums",
  },
  iconStatLabel: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 700,
  },
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "var(--shadow)",
  },
  projectModalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 390,
    background: "rgba(15,23,42,0.36)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  projectModalCard: {
    width: "100%",
    maxWidth: 680,
    borderRadius: 20,
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "0 24px 54px rgba(15,23,42,0.16)",
    padding: 16,
    display: "grid",
    gap: 14,
  },
  projectModalCardMobile: {
    maxWidth: 500,
    padding: 14,
  },
  projectModalHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  projectModalTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "var(--text)",
    letterSpacing: "-0.4px",
  },
  projectModalHint: {
    marginTop: 4,
    fontSize: 11,
    color: "var(--muted)",
    lineHeight: 1.5,
  },
  projectModalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr",
    gap: 12,
    alignItems: "start",
  },
  projectModalGridMobile: {
    gridTemplateColumns: "1fr",
  },
  projectModalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  projectColorPicker: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 8,
    alignItems: "center",
    padding: "2px 0 0",
  },
  projectColorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    justifySelf: "start",
  },
  projectModalSection: {
    gap: 10,
    padding: 12,
    borderRadius: 16,
  },
  projectModalToggleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },
  projectModalToggle: {
    gap: 10,
    padding: "8px 10px",
    borderRadius: 18,
    minHeight: 0,
  },
  projectModalToggleLabel: {
    fontSize: 13,
  },

  settingsGrid: {
    display: "grid",
    gap: 12,
  },
  settingsCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "var(--shadow)",
  },
  settingsDangerCard: {
    borderColor: "rgba(220,38,38,0.18)",
    background: "linear-gradient(180deg, var(--card), rgba(220,38,38,0.03))",
  },
  settingsProfileRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 18,
    alignItems: "center",
  },
  settingsAvatar: {
    width: 104,
    height: 104,
    borderRadius: 999,
    background: "var(--blueSoft)",
    border: "1px solid rgba(37,99,235,0.18)",
    color: "var(--blue)",
    fontSize: 34,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  settingsAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  settingsMetaLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--muted)",
    marginBottom: 6,
  },
  settingsEmail: {
    minHeight: 42,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    color: "var(--textSoft)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
  },
  settingsButtonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  settingsGhostBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    color: "var(--text)",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  settingsStack: {
    display: "grid",
    gap: 14,
  },
  settingsDangerText: {
    color: "var(--textSoft)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  settingsHistoryList: {
    display: "grid",
    gap: 12,
  },
  settingsHistoryItem: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    display: "grid",
    gap: 6,
  },
  settingsHistoryTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    color: "var(--text)",
  },
  settingsHistoryTime: {
    fontSize: 12,
    color: "var(--muted)",
    whiteSpace: "nowrap",
  },
  settingsHistoryDetail: {
    fontSize: 13,
    color: "var(--textSoft)",
    lineHeight: 1.5,
  },
  emptyStateCard: {
    background: "var(--card)",
    border: "1px dashed var(--border)",
    borderRadius: 18,
    padding: 24,
    display: "grid",
    gap: 12,
    justifyItems: "start",
    boxShadow: "var(--shadow)",
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "var(--text)",
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "var(--muted)",
    maxWidth: 520,
  },
  mobileProjectList: {
    display: "grid",
    gap: 12,
  },
  mobileProjectCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 18,
    padding: 14,
    display: "grid",
    gap: 12,
    boxShadow: "var(--shadow)",
  },
  mobileProjectHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  mobileProjectHeadMain: {
    display: "grid",
    gap: 6,
    minWidth: 0,
    flex: 1,
  },
  mobileProjectTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "var(--text)",
    lineHeight: 1.3,
  },
  mobileProjectMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  mobileProjectMeta: {
    fontSize: 14,
    fontWeight: 800,
    color: "var(--textSoft)",
  },
  mobileProjectMetaMuted: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted)",
    background: "var(--slateSoft)",
    border: "1px solid var(--border)",
    borderRadius: 999,
    padding: "4px 8px",
  },
  mobileProjectSubMeta: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 12,
    color: "var(--muted)",
  },
  mobileProjectActions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  mobileProjectActionBtn: {
    minHeight: 38,
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    color: "var(--text)",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  mobileProjectDeleteBtn: {
    minHeight: 38,
    borderRadius: 12,
    border: "1px solid var(--red)",
    background: "var(--redSoft)",
    color: "var(--red)",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  mobileProjectSummaryStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginBottom: 14,
  },
  mobileProjectSummaryCard: {
    background: "var(--slateSoft)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "10px 12px",
    minWidth: 0,
  },
  mobileProjectSummaryCardActive: {
    background: "var(--blueSoft)",
    border: "1px solid rgba(37,99,235,0.22)",
    borderRadius: 14,
    padding: "10px 12px",
    minWidth: 0,
    boxShadow: "0 8px 18px rgba(37,99,235,0.10)",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  projectBarRow: {
    border: "1px solid var(--border)",
    borderRadius: 12,
    background: "var(--slateSoft)",
    padding: 12,
  },
  projectBarHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  projectBarTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text)",
  },
  projectBarMeta: {
    fontSize: 11,
    color: "var(--muted)",
    marginTop: 2,
  },
  projectBarAmount: {
    fontSize: 14,
    fontWeight: 800,
    color: "var(--text)",
  },
  h2: {
    margin: 0,
    fontSize: 16,
    color: "var(--text)",
  },
  formLayout: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 14,
    alignItems: "start",
  },
  formSection: {
    display: "grid",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    background: "var(--slateSoft)",
    border: "1px solid var(--border)",
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "var(--muted)",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  formChecks: {
    display: "grid",
    gap: 10,
  },
  statusToggle: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.22)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,250,252,0.98))",
    color: "var(--text)",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
  },
  statusToggleActive: {
    border: "1px solid rgba(37,99,235,0.2)",
    boxShadow: "0 14px 32px rgba(37,99,235,0.08)",
  },
  statusToggleTrack: {
    position: "relative",
    width: 42,
    height: 24,
    borderRadius: 999,
    background: "rgba(148,163,184,0.22)",
    flexShrink: 0,
  },
  statusToggleTrackActive: {
    background: "rgba(59,130,246,0.92)",
  },
  statusToggleThumb: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: 999,
    background: "var(--white)",
    boxShadow: "0 4px 10px rgba(15,23,42,0.18)",
    transition: "all .18s ease",
  },
  statusToggleThumbActive: {
    left: 21,
  },
  statusToggleInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  statusToggleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusToggleIconWrapMuted: {
    background: "rgba(148,163,184,0.14)",
    color: "var(--muted)",
  },
  statusToggleIconWrapAmber: {
    background: "rgba(245,158,11,0.14)",
    color: "var(--amber)",
  },
  statusToggleIconWrapTeal: {
    background: "rgba(20,184,166,0.14)",
    color: "var(--teal)",
  },
  statusToggleLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--textSoft)",
    lineHeight: 1,
    letterSpacing: "-0.1px",
  },
  formActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  },
  check: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 4px",
    color: "var(--text)",
    fontWeight: 600,
    fontSize: 13,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "var(--blue)",
    color: "var(--white)",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid var(--red)",
    background: "var(--redSoft)",
    color: "var(--red)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  undoBar: {
    background: "var(--amberSoft)",
    color: "var(--amber)",
    border: "1px solid var(--amber)",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontWeight: 700,
    fontSize: 13,
  },
  msg: {
    background: "var(--blueSoft)",
    color: "var(--blue)",
    border: "1px solid var(--blue)",
    borderRadius: 12,
    padding: 12,
    fontWeight: 700,
    fontSize: 13,
  },
  metaText: {
    fontSize: 10,
    color: "var(--muted)",
    marginTop: 2,
  },
  invoiceList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  invoiceChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 6px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    maxWidth: "100%",
  },
  invoiceLink: {
    color: "var(--blue)",
    textDecoration: "none",
    fontSize: 11,
    fontWeight: 700,
    maxWidth: 130,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  invoiceRemoveBtn: {
    border: "none",
    background: "transparent",
    color: "var(--red)",
    padding: 0,
    width: 16,
    height: 16,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
    position: "relative",
    borderRadius: 14,
    transition: "background-color .18s ease, box-shadow .18s ease",
  },
  tableWrapDragging: {
    background: "rgba(15,23,42,0.10)",
    boxShadow: "inset 0 0 0 2px rgba(37,99,235,.22)",
  },
  dragOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.10)",
    borderRadius: 14,
    pointerEvents: "none",
    zIndex: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 760,
  },
  tableBig: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 6px",
    minWidth: 820,
  },
  dragNotice: {
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "var(--blueSoft)",
    color: "var(--blue)",
    border: "1px solid rgba(37,99,235,.22)",
    fontSize: 12,
    fontWeight: 700,
  },
  dropHint: {
    position: "absolute",
    left: 6,
    right: 6,
    padding: "4px 6px",
    borderRadius: 8,
    background: "var(--blue)",
    color: "var(--white)",
    fontSize: 10,
    fontWeight: 800,
    textAlign: "center",
    boxShadow: "0 10px 20px rgba(37,99,235,.24)",
  },
  dropHintBefore: {
    top: -18,
  },
  dropHintAfter: {
    bottom: -18,
  },
  th: {
    textAlign: "left",
    padding: "8px 8px",
    color: "var(--text)",
    borderBottom: "1px solid var(--border)",
    fontSize: 11,
    fontWeight: 800,
  },
  td: {
    padding: "10px 8px",
    color: "var(--text)",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
    fontSize: 13,
  },
  checkboxBtn: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rowActions: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  iconDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    border: "1px solid var(--red)",
    background: "var(--redSoft)",
    color: "var(--red)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  status: {
    display: "inline-grid",
    gridTemplateColumns: "8px auto",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    padding: "6px 10px",
    minHeight: 26,
    fontWeight: 700,
    fontSize: 11,
    lineHeight: 1,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    display: "inline-block",
    boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)",
  },
  miniSoft: {
    background: "var(--slateSoft)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "10px 14px",
    minWidth: 150,
    opacity: 0.95,
  },
  miniHighlight: {
    background: "var(--blueSoft)",
    border: "1px solid var(--blue)",
    borderRadius: 12,
    padding: "12px 16px",
    minWidth: 170,
    boxShadow: "0 6px 18px rgba(37,99,235,0.15)",
  },
  miniLabel: {
    fontSize: 12,
    color: "var(--muted)",
  },
  miniLabelStrong: {
    fontSize: 12,
    color: "var(--blue)",
    fontWeight: 700,
  },
  contextBtn: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    borderRadius: 8,
    cursor: "pointer",
    color: "var(--text)",
    fontSize: 13,
    fontWeight: 700,
  },
  colorPickerWrap: {
    display: "grid",
    gap: 10,
  },
  colorPickerHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "6px 6px 2px",
  },
  colorPickerTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text)",
  },
  colorPickerBackBtn: {
    border: "none",
    background: "transparent",
    color: "var(--blue)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  colorPickerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 8,
    padding: 6,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,.72)",
    cursor: "pointer",
  },
  loginWrap: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 18% 18%, rgba(37,99,235,0.38), transparent 30%), radial-gradient(circle at 82% 12%, rgba(39,193,141,0.22), transparent 28%), linear-gradient(135deg, #061226 0%, #081F45 52%, #102E67 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily:
      '"Inter", "Segoe UI", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  },
  loginShell: {
    width: "100%",
    maxWidth: 1160,
    minHeight: 660,
    display: "grid",
    gridTemplateColumns: "370px 1fr",
    overflow: "hidden",
    borderRadius: 28,
    background: "#081F45",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 34px 100px rgba(0, 0, 0, 0.38)",
  },
  loginShowcase: {
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    background:
      "radial-gradient(circle at 80% 18%, rgba(37,99,235,0.16), transparent 28%), linear-gradient(135deg, #0B1F45 0%, #0A1A34 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 16,
  },
  loginOrbOne: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 999,
    border: "58px solid rgba(96,165,250,0.16)",
    top: -150,
    left: -170,
  },
  loginOrbTwo: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: 999,
    border: "52px solid rgba(20,184,166,0.12)",
    bottom: -250,
    right: -120,
  },
  loginOrbThree: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(56,189,248,.34) 0%, rgba(56,189,248,0) 72%)",
    bottom: -20,
    left: 40,
  },
  loginBrand: {
    position: "relative",
    color: "var(--white)",
    fontSize: 70,
    fontWeight: 900,
    letterSpacing: "-2px",
    lineHeight: 0.98,
    fontFamily: '"Arial Black", "Segoe UI Black", "Segoe UI", sans-serif',
    textShadow: "0 18px 44px rgba(37,99,235,0.28)",
  },
  loginHeadline: {
    position: "relative",
    margin: 0,
    color: "rgba(255,255,255,0.94)",
    fontSize: 25,
    lineHeight: 1.06,
    maxWidth: 400,
    letterSpacing: "-0.7px",
    fontWeight: 900,
  },
  loginCopy: {
    position: "relative",
    margin: "10px 0 0",
    maxWidth: 430,
    color: "rgba(226,232,240,0.78)",
    fontSize: 13,
    lineHeight: 1.45,
    fontWeight: 600,
  },
  loginStatRow: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 28,
  },
  loginStatCard: {
    borderRadius: 18,
    padding: "16px 18px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(16px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
  },
  loginStatLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  loginStatValue: {
    marginTop: 6,
    color: "var(--white)",
    fontSize: 18,
    fontWeight: 800,
  },
  loginIllustrationGrid: {
    position: "relative",
    minHeight: 270,
    flex: "0 0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gridTemplateRows: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  loginSeoIntro: {
    position: "relative",
    zIndex: 1,
    maxWidth: 470,
    borderRadius: 22,
    padding: "18px 18px 16px",
    background: "rgba(8,31,69,0.72)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.16)",
    backdropFilter: "blur(10px)",
  },
  loginSeoLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  loginSeoLink: {
    color: "#DCEBFF",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 999,
    padding: "6px 8px",
    textDecoration: "none",
    fontSize: 10.5,
    fontWeight: 800,
  },
  loginIllustrationTile: {
    position: "relative",
    overflow: "hidden",
    minHeight: 92,
  },
  loginChartTile: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    padding: "18px 8px 20px 0",
  },
  loginBar: {
    width: 42,
    border: "1.5px solid rgba(255,255,255,0.86)",
    boxShadow: "8px -8px 0 rgba(255,255,255,0.10)",
  },
  loginTrendLine: {
    position: "absolute",
    left: 10,
    right: 18,
    top: 42,
    height: 38,
    borderTop: "3px solid #27C18D",
    borderRight: "3px solid #27C18D",
    transform: "skewY(-16deg)",
    opacity: 0.9,
  },
  loginInvoiceTile: {
    gridColumn: "3 / 4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginFolderShape: {
    position: "absolute",
    width: 154,
    height: 92,
    border: "1.5px solid rgba(255,255,255,0.84)",
    background: "#DDEAFE",
    boxShadow: "18px -18px 0 rgba(39,193,141,0.24)",
  },
  loginPaperShape: {
    position: "relative",
    width: 92,
    height: 78,
    border: "1.5px solid rgba(255,255,255,0.88)",
    background: "#F8FAFC",
    display: "grid",
    alignContent: "center",
    gap: 10,
    padding: 14,
    zIndex: 2,
  },
  loginPaperLine: {
    display: "block",
    height: 2,
    background: "rgba(8,31,69,0.55)",
  },
  loginPaperLineShort: {
    display: "block",
    width: "68%",
    height: 2,
    background: "rgba(8,31,69,0.55)",
  },
  loginCursorShape: {
    position: "absolute",
    right: 34,
    bottom: 34,
    width: 0,
    height: 0,
    borderLeft: "24px solid transparent",
    borderRight: "8px solid transparent",
    borderTop: "58px solid #27C18D",
    transform: "rotate(-20deg)",
    zIndex: 3,
  },
  loginCoinTile: {
    gridColumn: "2 / 3",
    gridRow: "2 / 3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginCoinShadow: {
    position: "absolute",
    width: 150,
    height: 20,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.34)",
    bottom: 38,
  },
  loginCoinMain: {
    width: 118,
    height: 118,
    borderRadius: "50%",
    background: "#C7F29B",
    border: "1.5px solid rgba(255,255,255,0.88)",
    boxShadow: "20px 16px 0 rgba(37,99,235,0.38)",
    transform: "rotate(-18deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#081F45",
    fontSize: 54,
    fontWeight: 900,
  },
  loginCoinSmall: {
    position: "absolute",
    right: 28,
    bottom: 60,
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "#D8F7FF",
    border: "1.5px solid rgba(255,255,255,0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#081F45",
    fontSize: 24,
    fontWeight: 900,
  },
  loginWalletTile: {
    gridColumn: "1 / 2",
    gridRow: "3 / 4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginWalletShape: {
    width: 174,
    height: 128,
    borderRadius: "46px 28px 28px 8px",
    border: "1.5px solid rgba(255,255,255,0.88)",
    background: "#93E0B4",
    boxShadow: "18px 0 0 rgba(37,99,235,0.42)",
    padding: 26,
    display: "grid",
    gridTemplateColumns: "24px 1fr",
    gap: "12px 14px",
    alignContent: "center",
  },
  loginWalletSlot: {
    gridColumn: "1 / 3",
    height: 30,
    border: "1.5px solid rgba(255,255,255,0.88)",
    background: "linear-gradient(90deg, #D9B8FF 0 62%, #FFF7F1 62% 100%)",
  },
  loginWalletLine: {
    height: 2,
    background: "rgba(8,31,69,0.52)",
    alignSelf: "center",
  },
  loginWalletLineShort: {
    height: 2,
    width: "70%",
    background: "rgba(8,31,69,0.52)",
    alignSelf: "center",
  },
  loginGraphTile: {
    gridColumn: "3 / 4",
    gridRow: "3 / 4",
    background: "linear-gradient(145deg, rgba(147,197,253,0.22), rgba(39,193,141,0.20))",
    border: "1.5px solid rgba(255,255,255,0.24)",
    borderRadius: 24,
    alignSelf: "end",
    height: 158,
  },
  loginCardStackBack: {
    position: "absolute",
    left: 22,
    right: 24,
    top: 42,
    height: 74,
    borderRadius: 18,
    border: "1.5px solid rgba(255,255,255,0.60)",
    background: "linear-gradient(135deg, #93E0B4, #BFDBFE)",
    transform: "rotate(-7deg)",
    boxShadow: "0 18px 34px rgba(0,0,0,0.18)",
  },
  loginCardStackFront: {
    position: "absolute",
    left: 30,
    right: 18,
    top: 56,
    height: 82,
    borderRadius: 20,
    border: "1.5px solid rgba(255,255,255,0.76)",
    background: "linear-gradient(135deg, #2563EB, #081F45)",
    transform: "rotate(5deg)",
    padding: 16,
    display: "grid",
    alignContent: "space-between",
    boxShadow: "0 20px 40px rgba(0,0,0,0.24)",
  },
  loginCardChip: {
    width: 30,
    height: 22,
    borderRadius: 7,
    background: "#C7F29B",
    display: "block",
  },
  loginCardNumberLine: {
    width: "78%",
    height: 3,
    borderRadius: 999,
    background: "rgba(255,255,255,0.72)",
    display: "block",
  },
  loginCardNumberShort: {
    width: "48%",
    height: 3,
    borderRadius: 999,
    background: "rgba(255,255,255,0.46)",
    display: "block",
  },
  loginReceiptMini: {
    position: "absolute",
    right: 18,
    top: 14,
    width: 62,
    height: 72,
    borderRadius: 14,
    background: "#F8FAFC",
    border: "1.5px solid rgba(255,255,255,0.82)",
    padding: 10,
    display: "grid",
    gap: 6,
    boxShadow: "0 16px 30px rgba(0,0,0,0.20)",
  },
  loginReceiptLine: {
    height: 2,
    borderRadius: 999,
    background: "rgba(8,31,69,0.34)",
    display: "block",
  },
  loginReceiptTotal: {
    width: 26,
    height: 26,
    borderRadius: 999,
    background: "#27C18D",
    color: "#081F45",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    marginTop: 2,
  },
  loginGraphCard: {
    position: "absolute",
    left: 18,
    bottom: 16,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(8,31,69,0.82)",
    padding: "10px 12px",
    display: "grid",
    gap: 4,
    boxShadow: "0 14px 28px rgba(8,31,69,0.14)",
  },
  loginGraphCardLabel: {
    color: "rgba(226,232,240,0.72)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.6,
  },
  loginGraphCardValue: {
    color: "#F8FAFC",
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 900,
  },
  loginCard: {
    width: "100%",
    maxWidth: "none",
    margin: "0 auto",
    background: "linear-gradient(180deg, rgba(12,35,76,0.98), rgba(6,18,38,0.98))",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 0,
    padding: "38px 36px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxShadow: "16px 0 40px rgba(0,0,0,0.16)",
    backdropFilter: "none",
  },
  loginLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    margin: "0 auto 16px",
    overflow: "hidden",
    background: "#F2F2F2",
    boxShadow: "0 16px 34px rgba(0,0,0,0.24)",
  },
  loginLogo: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    filter: "saturate(1.05)",
  },
  loginCardTitle: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.8px",
    textAlign: "center",
    lineHeight: 1.05,
    marginBottom: 18,
  },
  loginCardSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  loginSection: {
    display: "grid",
    gap: 10,
  },
  loginLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(226,232,240,0.72)",
  },
  loginInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 0,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 1.35,
    outline: "none",
  },
  loginMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  rememberMeLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(226,232,240,0.82)",
    fontSize: 13,
    fontWeight: 600,
  },
  forgotLink: {
    border: "none",
    background: "transparent",
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  loginPrimaryAction: {
    padding: "12px 14px",
    borderRadius: 0,
    border: "1px solid #2563EB",
    background: "linear-gradient(135deg, #2563EB 0%, #0B1F45 100%)",
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 12,
    boxShadow: "0 14px 26px rgba(37,99,235,0.24)",
  },
  loginDividerText: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: "18px 0",
    color: "rgba(226,232,240,0.62)",
    fontSize: 12,
    fontWeight: 700,
    position: "relative",
  },
  loginDividerTextLine: {
    flex: 1,
    height: 1,
    background: "rgba(226,232,240,0.16)",
  },
  loginSocialRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  googleIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mailIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginGoogleWideButton: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 0,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#F8FAFC",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
  },
  loginFacebookWideButton: {
    borderColor: "rgba(24,119,242,0.36)",
    background: "rgba(24,119,242,0.14)",
  },
  loginSocialGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    width: "100%",
  },
  loginSignupLine: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    color: "rgba(226,232,240,0.76)",
    fontSize: 13,
    fontWeight: 700,
  },
  switchAuthLink: {
    border: "none",
    background: "transparent",
    color: "#2563EB",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    alignSelf: "center",
    padding: 0,
  },
  googleMark: {
    width: 22,
    height: 22,
    borderRadius: 999,
    background: "conic-gradient(from 45deg, #4285F4 0deg 90deg, #34A853 90deg 180deg, #FBBC05 180deg 270deg, #EA4335 270deg 360deg)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1,
  },
  facebookMark: {
    width: 22,
    height: 22,
    borderRadius: 999,
    background: "#1877F2",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1,
    fontFamily: "Arial, sans-serif",
  },
  mobileIntroShell: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    textAlign: "center",
    padding: "44px 28px 32px",
    background:
      "radial-gradient(circle at 50% 18%, rgba(20,184,166,0.12) 0%, rgba(20,184,166,0) 24%), radial-gradient(circle at 80% 8%, rgba(37,99,235,0.13), transparent 26%), linear-gradient(180deg, #F6F7FC 0%, #EEF2FF 100%)",
    color: "#171923",
  },
  mobileIntroMarkWrap: {
    position: "relative",
    width: 132,
    height: 132,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.02) 70%, rgba(37,99,235,0) 100%)",
  },
  mobileIntroMarkQuestion: {
    position: "absolute",
    top: -2,
    right: 6,
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 900,
    color: "#2557D6",
    zIndex: 2,
  },
  mobileIntroMarkImage: {
    width: 108,
    height: 108,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #2563EB, #0F766E)",
    color: "#FFFFFF",
    fontSize: 54,
    fontWeight: 900,
    boxShadow: "0 14px 28px rgba(37,99,235,0.12)",
  },
  mobileIntroCopy: {
    marginTop: 18,
    fontSize: 24,
    lineHeight: 1.18,
    fontWeight: 800,
    letterSpacing: "-0.4px",
    color: "#1A1E2B",
    maxWidth: 280,
  },
  mobileIntroButton: {
    marginTop: 52,
    width: "100%",
    border: "none",
    borderRadius: 22,
    background: "linear-gradient(180deg, #2563EB 0%, #194AC6 100%)",
    color: "#FFFFFF",
    fontWeight: 900,
    fontSize: 20,
    padding: "18px 20px",
    cursor: "pointer",
    boxShadow: "0 16px 30px rgba(37,99,235,0.22)",
  },
  mobileAuthFormShell: {
    minHeight: "100svh",
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "max(18px, env(safe-area-inset-top, 0px)) 20px max(22px, env(safe-area-inset-bottom, 0px))",
    background: "linear-gradient(180deg, #F6F7FC 0%, #EEF2FF 100%)",
    color: "#171923",
  },
  mobileAuthTitle: {
    color: "#14213D",
    fontSize: 31,
    fontWeight: 900,
    letterSpacing: "-0.8px",
    textAlign: "center",
    lineHeight: 1.05,
    marginBottom: 10,
  },
  mobileAuthLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#60708E",
  },
  mobileAuthInput: {
    width: "100%",
    padding: "9px 0",
    borderRadius: 0,
    border: "none",
    borderBottom: "2px solid rgba(20, 33, 61, 0.55)",
    background: "transparent",
    color: "#14213D",
    fontSize: 16,
    lineHeight: 1.35,
    outline: "none",
  },
  mobileAuthMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },
  mobileAuthRemember: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#5A6885",
    fontSize: 14,
    fontWeight: 700,
  },
  mobileAuthForgot: {
    border: "none",
    background: "transparent",
    color: "#4B64C5",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  mobileAuthPrimaryButton: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(180deg, #2563EB 0%, #194AC6 100%)",
    color: "#FFFFFF",
    fontWeight: 900,
    fontSize: 18,
    cursor: "pointer",
    marginTop: 10,
    boxShadow: "0 16px 30px rgba(37,99,235,0.18)",
  },
  mobileAuthDivider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
    color: "#7B87A3",
    fontSize: 12,
    fontWeight: 700,
  },
  mobileAuthDividerLine: {
    flex: 1,
    height: 1,
    background: "rgba(123,135,163,0.32)",
  },
  mobileGoogleButton: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(255,255,255,0.9)",
    color: "#1A1E2B",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 6,
    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
  },
  mobileFacebookButton: {
    borderColor: "rgba(24,119,242,0.22)",
    background: "rgba(24,119,242,0.08)",
  },
  mobileSocialGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    width: "100%",
    marginTop: 6,
  },
  badge: {
    display: "inline-block",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#C7D2FE",
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: 1,
  },
};



