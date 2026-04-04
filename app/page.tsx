"use client";

import {
  Archive,
  CheckCircle2,
  CheckSquare,
  CircleAlert,
  Clock3,
  Copy,
  Download,
  FileText,
  FolderKanban,
  ImageUp,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  Palette,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Settings2,
  Square,
  SunMedium,
  Trash2,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  useCallback,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DARK,
  DEFAULT_COLORS,
  LIGHT,
  HOME_PROJECT_COLUMN_ORDER_DEFAULT,
  MAX_INVOICE_FILE_SIZE_BYTES,
  MAX_INVOICE_FILE_SIZE_MB,
  PROJECT_COLUMN_ORDER_DEFAULT,
  type DraftState,
  type DropPosition,
  type HomeProjectColumnKey,
  type InvoiceAttachment,
  type Odeme,
  type PdfWindow,
  type ProjectColumnKey,
  type RowMeta,
  type SortDirection,
  type SortKey,
  type StatusFilter,
  type StoredState,
  type TabMenu,
  type TabMeta,
  type ThemeMode,
  type ViewMode,
} from "./page.shared";
import {
  browserSupabase as supabase,
  setAuthStoragePreference,
} from "@/lib/supabase";
import type {
  FaturaEkiInsert,
  OdemeInsert,
  OdemeUpdate,
} from "@/lib/database.types";

const readStoredState = <T,>(key: string, fallback: T): StoredState<T> => {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem("odeme-theme-v1");
  return savedTheme === "dark" ? "dark" : "light";
};

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "-");

const isProjectColumnKey = (value: string): value is ProjectColumnKey =>
  PROJECT_COLUMN_ORDER_DEFAULT.includes(value as ProjectColumnKey);

const isHomeProjectColumnKey = (value: string): value is HomeProjectColumnKey =>
  HOME_PROJECT_COLUMN_ORDER_DEFAULT.includes(value as HomeProjectColumnKey);

const odemelerTable = () =>
  supabase.from("odemeler");

const faturaEkleriTable = () =>
  supabase.from("fatura_ekleri");

const tl = (v: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);

const shortDate = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
};

const shortDateTime = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dateValue = (v: string | null) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const durumScore = (i: Odeme) => (i.odendi ? 2 : i.fatura_kesildi ? 1 : 0);

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
    document.body.appendChild(script);
  });

function AnimatedMoney({
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

    // Animation state is intentionally kicked off when the value changes.
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

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div style={styles.stat}>
      <div style={styles.statHead}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{title}</div>
        <div style={styles.statIcon}>{icon}</div>
      </div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

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

  const [proje, setProje] = useState("");
  const [tutar, setTutar] = useState("");
  const [tarih, setTarih] = useState("");
  const [kdvli, setKdvli] = useState(false);
  const [faturaKesildi, setFaturaKesildi] = useState(false);
  const [odemeAlindi, setOdemeAlindi] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

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
  const [statusFilter] = useState<StatusFilter>("all");
  const [dateFrom] = useState("");
  const [dateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Odeme[] | null>(null);

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
  const [settingsName, setSettingsName] = useState("");
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState<string | null>(null);
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsPasswordRepeat, setSettingsPasswordRepeat] = useState("");
  const [settingsBusy, setSettingsBusy] = useState(false);

  const exportRef = useRef<HTMLElement | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const initialLoadRef = useRef(false);

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
    setFaturaKesildi(draft?.faturaKesildi ?? false);
    setOdemeAlindi(draft?.odemeAlindi ?? false);
  };

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
    localStorage.setItem("odeme-drafts-v1", JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem("odeme-row-meta-v1", JSON.stringify(rowMeta));
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
    initialLoadRef.current = false;
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

  useEffect(() => {
    const rowIds = data.map((row) => row.id).filter((id) => id > 0);
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
  }, [authUserId, data]);

  useEffect(() => {
    const close = () => setTabMenu((p) => ({ ...p, visible: false }));
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
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

    if (sortKey === "manual") {
      return [...rows].sort((a, b) => {
        const sa = a.sira ?? 999999;
        const sb = b.sira ?? 999999;
        if (sa !== sb) return sa - sb;
        return a.id - b.id;
      });
    }

    return [...rows].sort((a, b) => {
      let r = 0;
      if (sortKey === "proje") r = (a.proje || "").localeCompare(b.proje || "", "tr");
      if (sortKey === "durum") r = durumScore(a) - durumScore(b);
      if (sortKey === "fatura_tarihi") r = dateValue(a.fatura_tarihi) - dateValue(b.fatura_tarihi);
      if (sortKey === "tutar") r = Number(a.tutar || 0) - Number(b.tutar || 0);
      return sortDirection === "asc" ? r : -r;
    });
  }, [data, aktifSekme, sortKey, sortDirection]);

  const filterRows = (rows: Odeme[]) =>
    rows.filter((row) => {
      const q = searchTerm.trim().toLowerCase();
      const projeValue = (row.proje || "").toLowerCase();
      const grupValue = (row.grup || "").toLowerCase();

      const matchSearch = !q || projeValue.includes(q) || grupValue.includes(q);

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "paid"
            ? Boolean(row.odendi)
            : statusFilter === "invoiced"
              ? Boolean(!row.odendi && row.fatura_kesildi)
              : Boolean(!row.odendi && !row.fatura_kesildi);

      const rowDate = dateValue(row.fatura_tarihi);
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : null;
      const toDate = dateTo ? new Date(dateTo).getTime() : null;

      const matchFrom = fromDate === null ? true : rowDate >= fromDate;
      const matchTo = toDate === null ? true : rowDate <= toDate;

      return matchSearch && matchStatus && matchFrom && matchTo;
    });

  const filteredHomeRows = filterRows(homeBaseRows);

  const filteredActiveKayitlar = filterRows(aktifKayitlar);

  const toplam = filteredActiveKayitlar.reduce((sum, x) => sum + Number(x.tutar || 0), 0);
  const odenen = filteredActiveKayitlar
    .filter((x) => x.odendi)
    .reduce((sum, x) => sum + Number(x.tutar || 0), 0);
  const odemesiAlinanAdet = filteredActiveKayitlar.filter((x) => x.odendi).length;
  const faturasiKesilenAdet = filteredActiveKayitlar.filter(
    (x) => !x.odendi && x.fatura_kesildi
  ).length;
  const kalan = toplam - odenen;
  const tahsilatYuzdesiAktif = toplam > 0 ? Math.round((odenen / toplam) * 100) : 0;

  const tumToplam = filteredHomeRows.reduce((sum, x) => sum + Number(x.tutar || 0), 0);
  const tumOdeme = filteredHomeRows.filter((x) => x.odendi).length;
  const tumFatura = filteredHomeRows.filter((x) => !x.odendi && x.fatura_kesildi).length;
  const tumOdenenTutar = filteredHomeRows
    .filter((x) => x.odendi)
    .reduce((sum, x) => sum + Number(x.tutar || 0), 0);
  const tumKalanTutar = tumToplam - tumOdenenTutar;
  const tahsilatYuzdesiGenel =
    tumToplam > 0 ? Math.round((tumOdenenTutar / tumToplam) * 100) : 0;

  const homeProjectStats = gorunenSekmeler
    .map((tab) => {
      const rows = filteredHomeRows.filter((x) => (x.grup || "") === tab);
      const toplamTab = rows.reduce((sum, x) => sum + Number(x.tutar || 0), 0);
      const odenenTab = rows
        .filter((x) => x.odendi)
        .reduce((sum, x) => sum + Number(x.tutar || 0), 0);

      const oran = toplamTab > 0 ? Math.round((odenenTab / toplamTab) * 100) : 0;

      return {
        tab,
        kayit: rows.length,
        odenen: rows.filter((x) => x.odendi).length,
        fatura: rows.filter((x) => !x.odendi && x.fatura_kesildi).length,
        toplam: toplamTab,
        oran,
      };
    })
    .filter((item) => item.kayit > 0)
    .sort((a, b) => b.toplam - a.toplam);

  const selectedVisibleIds = filteredActiveKayitlar
    .filter((row) => selectedIds.includes(row.id))
    .map((row) => row.id);

  const allFilteredSelected =
    filteredActiveKayitlar.length > 0 &&
    selectedVisibleIds.length === filteredActiveKayitlar.length;

  const temizle = () => {
    setProje("");
    setTutar("");
    setTarih("");
    setKdvli(false);
    setFaturaKesildi(false);
    setOdemeAlindi(false);
    setEditId(null);
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
        ? "Ödeme alındı"
        : row.fatura_kesildi
          ? "Fatura kesildi"
          : "Bekliyor",
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
      .upload(path, file, { upsert: false });

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

  const exportPDF = async () => {
    try {
      setMsg("PDF hazırlanıyor...");

      await loadScript(
        "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
      );
      await loadScript(
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
      );

      const target = exportRef.current;
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

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

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

  const editAc = (row: Odeme) => {
    setMsg("");
    setEditId(row.id);
    setProje(row.proje || "");
    setTutar(row.tutar ? String(row.tutar) : "");
    setTarih(row.fatura_tarihi || "");
    setKdvli(Boolean(row.kdvli));
    setFaturaKesildi(Boolean(row.fatura_kesildi));
    setOdemeAlindi(Boolean(row.odendi));
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
      ...(editId ? {} : { sira: nextSira }),
    };

    const now = new Date().toISOString();

    const res = editId
      ? await odemelerTable().update(payload satisfies OdemeUpdate).eq("id", editId)
      : await odemelerTable().insert([payload]);

    if (res.error) {
      setMsg("Kayıt kaydedilemedi: " + res.error.message);
      return;
    }

    if (editId) {
      setRowMeta((prev) => ({
        ...prev,
        [editId]: {
          createdAt: prev[editId]?.createdAt || now,
          updatedAt: now,
        },
      }));
    }

    temizle();
    setMsg(editId ? "Kayıt güncellendi." : "Kayıt eklendi.");
    await yukle();
  }

  async function kaydiKopyala(row: Odeme) {
    if (!authUserId) return;

    const nextSira =
      aktifKayitlar.length > 0
        ? Math.max(...aktifKayitlar.map((x) => x.sira ?? 0)) + 1
        : 1;

    const { error } = await odemelerTable().insert([
      {
        user_id: authUserId,
        proje: `${row.proje || "Yeni Kayıt"} Kopya`,
        tutar: row.tutar,
        odendi: row.odendi,
        grup: row.grup,
        fatura_tarihi: row.fatura_tarihi,
        fatura_kesildi: row.fatura_kesildi,
        kdvli: row.kdvli,
        sira: nextSira,
      },
    ] satisfies OdemeInsert[]);

    if (error) {
      setMsg("Kopyalama başarısız: " + error.message);
      return;
    }

    setMsg("Kayıt çoğaltıldı.");
    await yukle();
  }

  async function durumIlerle(row: Odeme) {
    let next = { fatura_kesildi: false, odendi: false };

    if (!row.fatura_kesildi && !row.odendi) {
      next = { fatura_kesildi: true, odendi: false };
    } else if (row.fatura_kesildi && !row.odendi) {
      next = { fatura_kesildi: true, odendi: true };
    }

    const nextUpdate: OdemeUpdate = next;
    const { error } = await odemelerTable()
      .update(nextUpdate)
      .eq("id", row.id);

    if (error) {
      setMsg("Durum güncellenemedi: " + error.message);
      return;
    }

    const now = new Date().toISOString();

    setRowMeta((prev) => ({
      ...prev,
      [row.id]: {
        createdAt: prev[row.id]?.createdAt || now,
        updatedAt: now,
      },
    }));

    setData((prev) => prev.map((x) => (x.id === row.id ? { ...x, ...next } : x)));
  }

  async function bulkUpdate(type: "invoice" | "paid" | "delete") {
    const rows = filteredActiveKayitlar.filter((row) =>
      selectedVisibleIds.includes(row.id)
    );
    if (!rows.length) return;

    if (type === "delete") {
      const confirmed = window.confirm(`${rows.length} kayıt silinsin mi?`);
      if (!confirmed) return;
      setLastDeleted(rows);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      setMsg("Toplu işlem için oturum doğrulanamadı.");
      return;
    }

    const response = await fetch("/api/odemeler/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ids: rows.map((row) => row.id),
        action: type,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMsg(payload.error || "Toplu işlem başarısız.");
      return;
    }

    if (type === "delete") {
      setInvoiceMap((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          delete next[row.id];
        });
        return next;
      });
    } else {
      const now = new Date().toISOString();
      setRowMeta((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          next[row.id] = {
            createdAt: next[row.id]?.createdAt || now,
            updatedAt: now,
          };
        });
        return next;
      });
    }

    setSelectedIds([]);
    setMsg(
      type === "invoice"
        ? "Seçilen kayıtlar fatura kesildi olarak güncellendi."
        : type === "paid"
          ? "Seçilen kayıtlar ödendi olarak güncellendi."
          : "Seçilen kayıtlar silindi."
    );
    await yukle();
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
      sira: row.sira,
    }));

    const { error } = await odemelerTable().insert(payload);

    if (error) {
      setMsg("Geri alma başarısız: " + error.message);
      return;
    }

    setLastDeleted(null);
    setMsg("Silinen kayıtlar geri yüklendi.");
    await yukle();
  }

  async function kayitSil(id: number) {
    const row = data.find((x) => x.id === id) || null;

    const invoiceDelete = await deleteInvoicesForRows([id]);
    if (invoiceDelete.error) {
      setMsg(invoiceDelete.error);
      return;
    }

    const { error } = await odemelerTable().delete().eq("id", id);

    if (error) {
      setMsg("Kayıt silinemedi: " + error.message);
      return;
    }

    if (row) setLastDeleted([row]);
    if (editId === id) temizle();
    setMsg("Kayıt silindi.");
    await yukle();
  }

  async function sekmeSil(tabName: string) {
    const onay = window.confirm(
      `${tabName} sekmesindeki tüm kayıtlar silinecek. Emin misin?`
    );
    if (!onay) return;

    const rows = data.filter((x) => (x.grup || "") === tabName);
    const invoiceDelete = await deleteInvoicesForRows(rows.map((row) => row.id));
    if (invoiceDelete.error) {
      setMsg(invoiceDelete.error);
      return;
    }

    const res = await Promise.all(
      rows.map((x) => odemelerTable().delete().eq("id", x.id))
    );

    const failed = res.find((r) => r.error);
    if (failed?.error) {
      setMsg("Sekme silinemedi: " + failed.error.message);
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
    await yukle();
  }

  async function sekmeYenidenAdlandir(tabName: string) {
    const yeniAd = window.prompt("Sekmenin yeni adı ne olsun?", tabName);
    if (!yeniAd || !yeniAd.trim()) return;

    const rows = data.filter((x) => (x.grup || "") === tabName);
    const res = await Promise.all(
      rows.map((x) =>
        odemelerTable()
          .update({ grup: yeniAd.trim() } satisfies OdemeUpdate)
          .eq("id", x.id)
      )
    );

    const failed = res.find((r) => r.error);

    if (failed?.error) {
      setMsg("Sekme adı güncellenemedi: " + failed.error.message);
      return;
    }

    setTabMeta((prev) => {
      const next = { ...prev };
      if (next[tabName]) {
        next[yeniAd.trim()] = next[tabName];
        delete next[tabName];
      }
      return next;
    });

    setArchivedTabs((prev) =>
      prev.map((x) => (x === tabName ? yeniAd.trim() : x))
    );

    if (aktifSekme === tabName) {
      openProjectTab(yeniAd.trim());
    }

    setMsg("Sekme adı güncellendi.");
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

    const res = await Promise.all(
      updated.map((row, i) =>
        odemelerTable().update({ sira: i + 1 } satisfies OdemeUpdate).eq("id", row.id)
      )
    );

    const failed = res.find((r) => r.error);
    if (failed?.error) {
      setMsg("Sıralama kaydedilemedi: " + failed.error.message);
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

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredActiveKayitlar.map((row) => row.id));
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
      draggedColumn ?? (isProjectColumnKey(payload) ? payload : null);

    if (!activeColumn || activeColumn === column) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    if (draggedColumn !== activeColumn) {
      setDraggedColumn(activeColumn);
    }
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
      draggedHomeColumn ?? (isHomeProjectColumnKey(payload) ? payload : null);

    if (!activeColumn || activeColumn === column) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    if (draggedHomeColumn !== activeColumn) {
      setDraggedHomeColumn(activeColumn);
    }
    setDragOverHomeColumn(column);
    setHomeColumnDropPosition(offset < rect.width / 2 ? "before" : "after");
  };

  const durumGorunum = (row: Odeme) => {
    if (row.odendi) {
      return {
        text: "Ödeme alındı",
        bg: "var(--tealSoft)",
        color: "var(--teal)",
        rowBg: theme === "dark" ? "#0B1E1A" : "#F3FBFA",
      };
    }

    if (row.fatura_kesildi) {
      return {
        text: "Fatura kesildi",
        bg: "var(--amberSoft)",
        color: "var(--amber)",
        rowBg: theme === "dark" ? "#221A0B" : "#FFF9EF",
      };
    }

    return {
      text: "Henüz kesilmedi",
      bg: "var(--redSoft)",
      color: "var(--red)",
      rowBg: theme === "dark" ? "#221014" : "#FFF5F5",
    };
  };

  const aktifTabMeta = tabMeta[aktifSekme] || { color: "var(--blue)" };

  const projectColumns = projectColumnOrder.map((key) => {
    if (key === "select") {
      return {
        key,
        label: "SEÇ",
        className: "no-print",
        style: { ...styles.th, width: 52 },
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
          width: 70,
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
        },
        onClick: () => sortToggle("tutar"),
      };
    }

    return {
      key,
      label: "İŞLEM",
      className: "no-print",
      style: { ...styles.th, width: 160 },
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
        <td key={column} style={{ ...styles.td, width: 52 }} className="no-print">
          <button
            type="button"
            onClick={() => toggleSelected(row.id)}
            style={styles.checkboxBtn}
            title="Kaydı seç"
          >
            {selectedIds.includes(row.id) ? (
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
            width: 70,
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
          onDoubleClick={() => editAc(row)}
          title="Düzenlemek için çift tıkla"
          style={{
            ...styles.td,
            borderLeft: `5px solid ${aktifTabMeta.color}`,
            cursor: "pointer",
          }}
        >
          {editing ? (
            <input
              className="soft-input"
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
        <td key={column} style={styles.td}>
          {editing ? (
            <select
              className="soft-input"
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
              <option value="bekliyor">Henüz kesilmedi</option>
              <option value="fatura">Fatura kesildi</option>
              <option value="odeme">Ödeme alındı</option>
            </select>
          ) : (
            <button
              className="status-button"
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
              {durum.text}
            </button>
          )}
        </td>
      );
    }

    if (column === "fatura_tarihi") {
      return (
        <td
          key={column}
          onDoubleClick={() => editAc(row)}
          title="Düzenlemek için çift tıkla"
          style={{ ...styles.td, cursor: "pointer" }}
        >
          {editing ? (
            <input
              className="soft-input"
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
          onDoubleClick={() => editAc(row)}
          title="Düzenlemek için çift tıkla"
          style={{
            ...styles.td,
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
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                style={styles.input}
              />
              <select
                className="soft-input"
                value={kdvli ? "kdvli" : "kdvsiz"}
                onChange={(e) => setKdvli(e.target.value === "kdvli")}
                style={styles.input}
              >
                <option value="kdvsiz">KDV’siz</option>
                <option value="kdvli">+ %20 KDV</option>
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
              <div>{row.tutar ? tl(Number(row.tutar)) : "—"}</div>
              {row.kdvli ? <div style={styles.metaText}>+ %20 KDV</div> : null}
            </div>
          )}
        </td>
      );
    }

    return (
      <td key={column} style={styles.td} className="no-print">
        <div style={styles.rowActions}>
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
        Authorization: `Bearer ${accessToken}`,
      },
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
    const ad = window.prompt("Proje adı");
    if (!ad || !ad.trim()) return;

    const clean = ad.trim();
    setTabMeta((prev) => {
      if (prev[clean]) return prev;
      return {
        ...prev,
        [clean]: {
          color: DEFAULT_COLORS[Object.keys(prev).length % DEFAULT_COLORS.length],
        },
      };
    });
    setData((prev) => {
      if (prev.some((item) => (item.grup || "") === clean)) return prev;
      return [
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
          sira: null,
        },
      ];
    });

    openProjectTab(clean);
  }

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
    <div style={{ ...styles.loginWrap, ...themeVars }}>
      <div style={styles.loginShell}>
        <div style={styles.loginShowcase}>
          <div style={styles.loginOrbOne} />
          <div style={styles.loginOrbTwo} />
          <div style={styles.loginOrbThree} />

          <div style={styles.loginBrand}>{"\u00d6DED\u0130 M\u0130"}</div>
          <h1 style={styles.loginHeadline}>{"Parac\u0131klar Geldi Mi Acep..."}</h1>
          </div>

        <div style={styles.loginCard}>
          <div style={styles.loginCardTitle}>
            {signupMode ? "Hesap Oluştur" : "Giriş Yap"}
          </div>

          <div style={styles.loginSection}>
            <div style={styles.loginLabel}>{"E-posta"}</div>
            <input
              className="soft-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.loginInput}
            />
            <div style={styles.loginLabel}>{"\u015eifre"}</div>
            <input
              className="soft-input"
              type="password"
              placeholder={"\u015eifre"}
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
                <span>{"Beni Hatırla"}</span>
              </label>
              <button
                type="button"
                className="hover-button"
                onClick={() => void authResetPassword()}
                style={styles.forgotLink}
              >
                {"\u015eifremi Unuttum"}
              </button>
            </div>
            <button
              className="hover-button"
              onClick={() => void (signupMode ? authSignUp() : authLogin())}
              style={styles.loginPrimaryAction}
            >
              <span style={styles.btnInner}>
                <Mail size={16} />
                {signupMode ? "Hesap Oluştur" : "Giriş Yap"}
              </span>
            </button>
          </div>

          <div style={styles.loginDividerText}>
            <span style={styles.loginDividerTextLine} />
            <span>{"Veya hesap oluştur"}</span>
            <span style={styles.loginDividerTextLine} />
          </div>

          <div style={styles.loginSocialRow}>
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

  const renderSettingsContent = () => (
    <div style={styles.settingsGrid}>
      <div style={styles.settingsCard}>
        <div style={styles.sectionHead}>
          <h2 style={styles.h2}>Hesap Ayarları</h2>
          <Settings2 size={18} color={palette.muted} />
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
              <div style={styles.settingsEmail}>{authEmail || "—"}</div>
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
          <LockKeyhole size={18} color={palette.muted} />
        </div>

        <div style={styles.settingsStack}>
          <div>
            <div style={styles.settingsMetaLabel}>Yeni Şifre</div>
            <input
              className="soft-input"
              type="password"
              value={settingsPassword}
              onChange={(e) => setSettingsPassword(e.target.value)}
              placeholder="Yeni şifre"
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
              placeholder="Yeni şifre tekrar"
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
          <CircleAlert size={18} color={palette.red} />
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
                placeholder="Mevcut şifre"
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
    </div>
  );

  if (!authUserId) {
    return renderAuthScreen();
  }





  return (
    <div style={{ ...styles.page, ...themeVars }}>
      <style>{`
        .hover-button{transition:all .18s ease}
        .hover-button:hover{filter:brightness(.97);transform:translateY(-1px)}
        .soft-input{transition:border-color .18s ease,box-shadow .18s ease}
        .soft-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.10)}
        .sidebar-item{transition:all .18s ease}
        .sidebar-item:hover{background:rgba(255,255,255,.06)}
        .panel-row{transition:transform .18s ease, box-shadow .18s ease, background-color .22s ease}
        .panel-row:hover{transform:translateY(-2px) scale(1.003);box-shadow:0 8px 18px rgba(15,23,42,.08)}
        .status-button{transition:all .18s ease}
        .status-button:hover{transform:scale(1.015)}
        .status-button:active{transform:scale(.985)}
        @media (max-width: 980px){
          .app-shell{grid-template-columns:1fr !important}
          .app-sidebar{position:static !important}
        }
        @media print{
          *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important}
          html,body{background:white !important}
          .no-print{display:none !important}
        }
      `}</style>

      <div style={styles.shell} className="app-shell">
        <aside style={styles.sidebar} className="app-sidebar">
          <div>
            <div style={styles.sidebarTitle}>Panel</div>
            <div style={styles.sidebarSub}>
              {authEmail ? authEmail : "Tahsilat paneli"}
            </div>
          </div>

          <div style={styles.sidebarTabs}>
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
              style={{
                ...styles.tab,
                border: "1px dashed var(--blue)",
                color: "#93C5FD",
                fontWeight: 800,
              }}
            >
              <span style={styles.sidebarTabInner}>
                <Plus size={16} />
                Yeni Proje
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
                  style={
                    viewMode === "project" && aktifSekme === tab
                      ? styles.activeTab
                      : styles.tab
                  }
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

          <div style={styles.sidebarBottom}>
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

        <main style={styles.content} ref={exportRef}>
          <div style={styles.topBar}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, color: "var(--text)" }}>
                {viewMode === "home"
                  ? "Ana Sayfa"
                  : viewMode === "settings"
                    ? "Hesap Ayarları"
                    : aktifSekme || "Proje"}
              </h1>
              <div style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>
                {viewMode === "home"
                  ? "Tahsilat ve fatura takibinin genel özeti"
                  : viewMode === "settings"
                    ? "Profil, güvenlik ve hesap işlemleri"
                    : "Sekme detayları"}
              </div>
            </div>

            <div style={styles.topBarActions}>
              {viewMode !== "settings" ? (
                <div style={styles.topSearchWrap}>
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
              ) : null}
              <button
                className="hover-button"
                onClick={() =>
                  setTheme((p) => (p === "light" ? "dark" : "light"))
                }
                style={styles.secondaryBtn}
              >
                <span style={styles.btnInner}>
                  {theme === "light" ? <Moon size={16} /> : <SunMedium size={16} />}
                  {theme === "light" ? "Karanlık Tema" : "Açık Tema"}
                </span>
              </button>

              <button
                className="hover-button"
                onClick={() => void cikisYap()}
                style={styles.secondaryBtn}
              >
                <span style={styles.btnInner}>
                  <LogOut size={16} />
                  Çıkış Yap
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
            renderSettingsContent()
          ) : (
            <>
          <div style={styles.heroCard}>
            <div style={styles.heroTopRow}>
              <div>
                <div style={styles.heroLabel}>TOPLAM</div>
                <div style={styles.heroValue}>
                  {tl(viewMode === "home" ? tumToplam : toplam)}
                </div>
              </div>
              <div style={styles.heroActionGroup}>
                <button
                  className="no-print"
                  onClick={exportWord}
                  style={styles.heroActionBtnWord}
                >
                  <span style={styles.heroActionInner}>
                    <FileText size={15} />
                    WORD
                  </span>
                </button>

                <button
                  className="no-print"
                  onClick={exportExcel}
                  style={styles.heroActionBtnExcel}
                >
                  <span style={styles.heroActionInner}>
                    <Download size={15} />
                    EXCEL
                  </span>
                </button>

                <button
                  className="no-print"
                  onClick={exportPDF}
                  style={styles.heroActionBtnPdf}
                >
                  <span style={styles.heroActionInner}>
                    <FileText size={15} />
                    PDF
                  </span>
                </button>

                <input
                  ref={invoiceInputRef}
                  type="file"
                  accept=".pdf,image/*"
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

              </div>
            </div>

            <div style={styles.heroSubRow}>
              <div>
                <div style={styles.heroSubTitle}>ÖDENEN</div>
                <div style={styles.heroSubValue}>
                  {tl(viewMode === "home" ? tumOdenenTutar : odenen)}
                </div>
              </div>

              <div style={styles.heroDivider} />

              <div>
                <div style={styles.heroSubTitle}>KALAN</div>
                <div style={styles.heroSubValue}>
                  {tl(viewMode === "home" ? tumKalanTutar : kalan)}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.statsGrid}>
            {viewMode === "home" ? (
              <>
                <Stat
                  title="Toplam Kayıt"
                  value={String(filteredHomeRows.length)}
                  icon={<FolderKanban size={16} color={palette.blue} />}
                />
                <Stat
                  title="Ödeme Alındı"
                  value={String(tumOdeme)}
                  icon={<CheckCircle2 size={16} color={palette.teal} />}
                />
                <Stat
                  title="Fatura Kesildi"
                  value={String(tumFatura)}
                  icon={<Receipt size={16} color={palette.amber} />}
                />
                <Stat
                  title="Toplam Tutar"
                  value={tl(tumToplam)}
                  icon={<Wallet size={16} color={palette.blue} />}
                />
              </>
            ) : (
              <>
                <Stat
                  title="Toplam Kayıt"
                  value={String(filteredActiveKayitlar.length)}
                  icon={<FolderKanban size={16} color={aktifTabMeta.color} />}
                />
                <Stat
                  title="Ödeme Alındı"
                  value={String(odemesiAlinanAdet)}
                  icon={<CheckCircle2 size={16} color={palette.teal} />}
                />
                <Stat
                  title="Fatura Kesildi"
                  value={String(faturasiKesilenAdet)}
                  icon={<Receipt size={16} color={palette.amber} />}
                />
                <Stat
                  title="Kalan Tahsilat"
                  value={tl(kalan)}
                  icon={<Clock3 size={16} color={palette.red} />}
                />
              </>
            )}
          </div>

          {viewMode === "home" ? (
            <div style={styles.quickGrid}>
              <div style={styles.quickCard}>
                <div style={styles.quickTitle}>Tahsilat Özeti</div>
                <div style={styles.quickBig}>{tl(tumOdenenTutar)}</div>
                <div style={styles.quickMuted}>Filtreye göre tahsil edilen tutar</div>

                <div style={styles.progressWrap}>
                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${tahsilatYuzdesiGenel}%`,
                    }}
                  />
                </div>

                <div style={styles.quickFooterRow}>
                  <span>Tahsilat Oranı</span>
                  <strong>%{tahsilatYuzdesiGenel}</strong>
                </div>

                <div style={styles.quickFooterRow}>
                  <span>Kalan Tutar</span>
                  <strong>{tl(tumKalanTutar)}</strong>
                </div>
              </div>

              <div style={styles.quickCard}>
                <div style={styles.quickTitle}>Hızlı Durum</div>

                <div style={styles.iconStatGrid}>
                  <div style={styles.iconStatBox}>
                    <div style={styles.iconStatIcon}>
                      <FolderKanban size={18} color={palette.blue} />
                    </div>
                    <div style={styles.iconStatNumber}>{homeProjectStats.length}</div>
                    <div style={styles.iconStatLabel}>Proje</div>
                  </div>

                  <div style={styles.iconStatBox}>
                    <div style={styles.iconStatIcon}>
                      <CheckCircle2 size={18} color={palette.teal} />
                    </div>
                    <div style={styles.iconStatNumber}>{tumOdeme}</div>
                    <div style={styles.iconStatLabel}>Ödeme</div>
                  </div>

                  <div style={styles.iconStatBox}>
                    <div style={styles.iconStatIcon}>
                      <Receipt size={18} color={palette.amber} />
                    </div>
                    <div style={styles.iconStatNumber}>{tumFatura}</div>
                    <div style={styles.iconStatLabel}>Fatura</div>
                  </div>

                  <div style={styles.iconStatBox}>
                    <div style={styles.iconStatIcon}>
                      <Clock3 size={18} color={palette.red} />
                    </div>
                    <div style={styles.iconStatNumber}>
                      {filteredHomeRows.filter((x) => !x.odendi).length}
                    </div>
                    <div style={styles.iconStatLabel}>Bekleyen</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.quickGrid}>
              <div style={styles.quickCard}>
                <div style={styles.quickTitle}>Sekme Özeti</div>
                <div style={styles.quickBig}>{tl(toplam)}</div>
                <div style={styles.quickMuted}>Bu sekmenin toplamı</div>

                <div style={styles.progressWrap}>
                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${tahsilatYuzdesiAktif}%`,
                      background: `linear-gradient(90deg, ${aktifTabMeta.color}, var(--teal))`,
                    }}
                  />
                </div>

                <div style={styles.quickFooterRow}>
                  <span>Tahsilat Oranı</span>
                  <strong>%{tahsilatYuzdesiAktif}</strong>
                </div>

                <div style={styles.quickFooterRow}>
                  <span>Ödenen</span>
                  <strong>{tl(odenen)}</strong>
                </div>

                <div style={styles.quickFooterRow}>
                  <span>Kalan</span>
                  <strong>{tl(kalan)}</strong>
                </div>
              </div>

              <div style={styles.quickCard}>
                <div style={styles.quickTitle}>Hızlı Bilgi</div>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <div style={styles.quickFooterRow}>
                    <span>Ödeme Alınan</span>
                    <strong>{odemesiAlinanAdet}</strong>
                  </div>
                  <div style={styles.quickFooterRow}>
                    <span>Fatura Kesilen</span>
                    <strong>{faturasiKesilenAdet}</strong>
                  </div>
                  <div style={styles.quickFooterRow}>
                    <span>Bekleyen</span>
                    <strong>{filteredActiveKayitlar.filter((x) => !x.odendi).length}</strong>
                  </div>
                  <div style={styles.quickFooterRow}>
                    <span>Seçili Kayıt</span>
                    <strong>{selectedVisibleIds.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === "home" ? (
            <div style={styles.card}>
              <div style={styles.sectionHead}>
                <h2 style={{ ...styles.h2, fontWeight: 900 }}>Genel Proje Özeti</h2>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {homeProjectStats.length} proje
                </div>
              </div>

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
                              setDraggedHomeColumn(column.key);
                            }}
                            onDragEnd={() => {
                              setDraggedHomeColumn(null);
                              setDragOverHomeColumn(null);
                            }}
                            onDragOver={(e) => handleHomeColumnDragOver(e, column.key)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const payload = e.dataTransfer.getData("text/plain");
                              const sourceColumn =
                                draggedHomeColumn ??
                                (isHomeProjectColumnKey(payload) ? payload : null);

                              if (sourceColumn) {
                                moveHomeProjectColumn(
                                  sourceColumn,
                                  column.key,
                                  homeColumnDropPosition
                                );
                              }
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
                                {tl(item.toplam)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.card}>
                <div style={styles.sectionHead}>
                  <h2 style={styles.h2}>Kayıt Ekle / Güncelle</h2>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    Taslak otomatik kaydediliyor
                  </div>
                </div>

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
                    value={kdvli ? "kdvli" : "kdvsiz"}
                    onChange={(e) => {
                      const value = e.target.value === "kdvli";
                      setKdvli(value);
                      updateDraftField({ kdvli: value });
                    }}
                    style={styles.input}
                  >
                    <option value="kdvsiz">KDV’siz</option>
                    <option value="kdvli">+ %20 KDV</option>
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

                  <label style={styles.check}>
                    <input
                      type="checkbox"
                      checked={faturaKesildi}
                      onChange={(e) => {
                        const value = e.target.checked;
                        setFaturaKesildi(value);
                        updateDraftField({ faturaKesildi: value });
                      }}
                    />
                    Fatura Kesildi
                  </label>

                  <label style={styles.check}>
                    <input
                      type="checkbox"
                      checked={odemeAlindi}
                      onChange={(e) => {
                        const value = e.target.checked;
                        const nextFaturaKesildi = value ? true : faturaKesildi;
                        setOdemeAlindi(value);
                        setFaturaKesildi(nextFaturaKesildi);
                        updateDraftField({
                          odemeAlindi: value,
                          faturaKesildi: nextFaturaKesildi,
                        });
                      }}
                    />
                    Ödeme Alındı
                  </label>

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

              <div style={styles.card} className="no-print">
                <div style={styles.bulkHead}>
                  <div style={styles.bulkTitle}>Toplu İşlem</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {selectedVisibleIds.length} kayıt seçili
                  </div>
                </div>

                <div style={styles.bulkActions}>
                  <button
                    className="hover-button"
                    onClick={toggleSelectAll}
                    style={styles.secondaryBtn}
                  >
                    <span style={styles.btnInner}>
                      {allFilteredSelected ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                      {allFilteredSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
                    </span>
                  </button>

                  <button
                    className="hover-button"
                    onClick={() => void bulkUpdate("invoice")}
                    style={styles.secondaryBtn}
                  >
                    <span style={styles.btnInner}>
                      <Receipt size={16} />
                      Fatura Kesildi Yap
                    </span>
                  </button>

                  <button
                    className="hover-button"
                    onClick={() => void bulkUpdate("paid")}
                    style={styles.primaryBtn}
                  >
                    <span style={styles.btnInner}>
                      <CheckCircle2 size={16} />
                      Ödendi Yap
                    </span>
                  </button>

                  <button
                    className="hover-button"
                    onClick={() => void bulkUpdate("delete")}
                    style={styles.deleteBtn}
                  >
                    <span style={styles.btnInner}>
                      <Trash2 size={16} />
                      Seçilileri Sil
                    </span>
                  </button>
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

              <div style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={styles.miniSoft}>
                    <div style={styles.miniLabel}>Ara Toplam</div>
                    <AnimatedMoney value={toplam} />
                  </div>

                  <div style={styles.miniHighlight}>
                    <div style={styles.miniLabelStrong}>Ödenen</div>
                    <AnimatedMoney value={odenen} strong />
                  </div>

                  <div style={styles.miniSoft}>
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
                                setDraggedColumn(column.key);
                              }}
                              onDragEnd={() => {
                                setDraggedColumn(null);
                                setDragOverColumn(null);
                              }}
                              onDragOver={(e) => handleColumnDragOver(e, column.key)}
                              onDrop={(e) => {
                                e.preventDefault();
                                const payload = e.dataTransfer.getData("text/plain");
                                const sourceColumn =
                                  draggedColumn ??
                                  (isProjectColumnKey(payload) ? payload : null);

                                if (sourceColumn) {
                                  moveProjectColumn(
                                    sourceColumn,
                                    column.key,
                                    columnDropPosition
                                  );
                                }
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
                            className="panel-row"
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

                  {filteredActiveKayitlar.length === 0 ? (
                    <div
                      style={{
                        color: "var(--muted)",
                        paddingTop: 10,
                        fontSize: 13,
                      }}
                    >
                      Filtreye uygun kayıt yok.
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}

            </>
          )}

          {loading ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Veriler yükleniyor...
            </div>
          ) : null}
        </main>
      </div>

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
    fontFamily: 'Inter, "SF Pro Display", Arial, sans-serif',
    fontVariantNumeric: "tabular-nums",
  },
  shell: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "220px 1fr",
  },
  sidebar: {
    background: "var(--sidebarBg)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    borderRight: "1px solid rgba(255,255,255,0.05)",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  sidebarTitle: {
    color: "var(--white)",
    fontSize: 18,
    fontWeight: 800,
  },
  sidebarSub: {
    color: "#8ea2b7",
    fontSize: 12,
  },
  sidebarTabs: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sidebarBottom: {
    marginTop: "auto",
    display: "grid",
    gap: 8,
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
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "transparent",
    color: "#d7e3ef",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  activeTab: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "var(--blue)",
    color: "var(--white)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37,99,235,0.22)",
  },
  content: {
    background: "var(--contentBg)",
    padding: 20,
    display: "grid",
    gap: 12,
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
    padding: 20,
    borderRadius: 16,
  },
  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  heroActionGroup: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginLeft: "auto",
    padding: 6,
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
  },
  heroActionInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: '"Arial Black", "Segoe UI Black", "Segoe UI", sans-serif',
    letterSpacing: "-0.15px",
    whiteSpace: "nowrap",
  },
  heroActionBtnWord: {
    minWidth: 88,
    minHeight: 34,
    padding: "8px 10px",
    borderRadius: 11,
    border: "1px solid rgba(78,127,223,0.20)",
    background: "#4E7FDF",
    color: "#FFFFFF",
    fontWeight: 900,
    fontSize: 10,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(34,82,182,0.14)",
  },
  heroActionBtnExcel: {
    minWidth: 92,
    minHeight: 34,
    padding: "8px 10px",
    borderRadius: 11,
    border: "1px solid rgba(31,169,127,0.20)",
    background: "linear-gradient(135deg, #34C79A, #1FA97F)",
    color: "#FFFFFF",
    fontWeight: 900,
    fontSize: 10,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(19,110,82,0.14)",
  },
  heroActionBtnPdf: {
    minWidth: 80,
    minHeight: 34,
    padding: "8px 10px",
    borderRadius: 11,
    border: "1px solid rgba(213,83,83,0.20)",
    background: "linear-gradient(135deg, #E66A6A, #D55353)",
    color: "#FFFFFF",
    fontWeight: 900,
    fontSize: 10,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(145,43,43,0.14)",
  },
  heroLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: 800,
    letterSpacing: 1,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: 900,
    letterSpacing: "-0.8px",
    fontVariantNumeric: "tabular-nums",
  },
  heroSubRow: {
    display: "flex",
    gap: 20,
    marginTop: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  heroSubTitle: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: 700,
  },
  heroSubValue: {
    fontSize: 22,
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
    padding: 14,
    boxShadow: "var(--shadow)",
  },
  statHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    background: "var(--slateSoft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
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
    borderRadius: 14,
    padding: 16,
    boxShadow: "var(--shadow)",
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
  iconStatGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 12,
  },
  iconStatBox: {
    border: "1px solid var(--border)",
    borderRadius: 14,
    background: "var(--slateSoft)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-start",
  },
  iconStatIcon: {
    fontSize: 20,
    lineHeight: 1,
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
    borderRadius: 14,
    padding: 14,
    boxShadow: "var(--shadow)",
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 8,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
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
  bulkHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  bulkTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "var(--text)",
  },
  bulkActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
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
    fontSize: 11,
    color: "var(--muted)",
    marginTop: 3,
  },
  invoiceList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  invoiceChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--slateSoft)",
    maxWidth: "100%",
  },
  invoiceLink: {
    color: "var(--blue)",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 700,
    maxWidth: 180,
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
    minWidth: 1120,
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
    padding: "12px 12px",
    color: "var(--text)",
    borderBottom: "1px solid var(--border)",
    fontSize: 12,
    fontWeight: 800,
  },
  td: {
    padding: "12px 12px",
    color: "var(--text)",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
    fontSize: 14,
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
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  iconDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "1px solid var(--red)",
    background: "var(--redSoft)",
    color: "var(--red)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
  },
  dot: {
    width: 10,
    height: 10,
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
    background: "linear-gradient(135deg, #a4b0ff 0%, #c8cfff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: 'Inter, "SF Pro Display", Arial, sans-serif',
  },
  loginShell: {
    width: "100%",
    maxWidth: 1180,
    minHeight: 640,
    display: "grid",
    gridTemplateColumns: "1.1fr .9fr",
    overflow: "hidden",
    borderRadius: 28,
    background: "#0B1546",
    boxShadow: "0 32px 90px rgba(15, 23, 66, 0.34)",
  },
  loginShowcase: {
    position: "relative",
    overflow: "hidden",
    padding: "48px 44px",
    background: "linear-gradient(180deg, #0C1C5A 0%, #09143D 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
  },
  loginOrbOne: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 999,
    border: "58px solid rgba(128, 104, 255, 0.18)",
    top: -150,
    left: -170,
  },
  loginOrbTwo: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: 999,
    border: "52px solid rgba(118, 82, 255, 0.14)",
    bottom: -250,
    right: -120,
  },
  loginOrbThree: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(104,195,255,.32) 0%, rgba(104,195,255,0) 72%)",
    bottom: -20,
    left: 40,
  },
  loginBrand: {
    position: "relative",
    color: "var(--white)",
    fontSize: 72,
    fontWeight: 900,
    letterSpacing: "-2px",
    lineHeight: 0.98,
    fontFamily: '"Arial Black", "Segoe UI Black", "Segoe UI", sans-serif',
    textShadow: "4px 4px 0 rgba(111, 141, 255, 0.35)",
  },
  loginHeadline: {
    position: "relative",
    margin: 0,
    color: "rgba(255,255,255,0.88)",
    fontSize: 28,
    lineHeight: 1.1,
    maxWidth: 420,
    letterSpacing: "-0.6px",
    fontWeight: 700,
  },
  loginCopy: {
    position: "relative",
    margin: 0,
    color: "rgba(255,255,255,0.74)",
    fontSize: 18,
    fontWeight: 500,
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
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)",
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
  loginCard: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
    background: "linear-gradient(180deg, #4152C9 0%, #3648B8 100%)",
    border: "1px solid rgba(12, 25, 87, 0.55)",
    borderRadius: 18,
    padding: "34px 28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxShadow: "0 18px 42px rgba(13, 23, 77, 0.32)",
  },
  loginCardTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-0.8px",
    textAlign: "center",
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
    color: "rgba(255,255,255,0.7)",
  },
  loginInput: {
    width: "100%",
    padding: "8px 0",
    borderRadius: 0,
    border: "none",
    borderBottom: "2px solid rgba(10, 20, 72, 0.72)",
    background: "transparent",
    color: "#FFFFFF",
    fontSize: 14,
    outline: "none",
  },
  loginMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 6,
  },
  rememberMeLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: 600,
  },
  forgotLink: {
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  loginPrimaryAction: {
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid rgba(6, 12, 48, 0.9)",
    background: "#091C68",
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 12,
  },
  loginDividerText: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: "24px 0 14px",
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: 700,
    position: "relative",
  },
  loginDividerTextLine: {
    flex: 1,
    height: 1,
    background: "rgba(255,255,255,0.18)",
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
  switchAuthLink: {
    marginTop: 14,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
    alignSelf: "center",
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
  badge: {
    display: "inline-block",
    width: "fit-content",
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#C7D2FE",
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: 1,
  },
};
