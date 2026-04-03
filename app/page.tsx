"use client";

import { createClient } from "@supabase/supabase-js";
import {
  Archive,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  Clock3,
  Copy,
  Download,
  FileText,
  Filter,
  FolderKanban,
  LayoutDashboard,
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

type Odeme = {
  id: number;
  user_id?: string | null;
  proje: string | null;
  tutar: number | null;
  odendi: boolean | null;
  grup: string | null;
  fatura_tarihi: string | null;
  fatura_kesildi: boolean | null;
  kdvli: boolean | null;
  sira: number | null;
};

type ViewMode = "home" | "project";
type SortKey = "manual" | "proje" | "durum" | "fatura_tarihi" | "tutar";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "paid" | "invoiced" | "waiting";
type ThemeMode = "light" | "dark";
type AuthMode = "login" | "signup";

type TabMenu = {
  visible: boolean;
  x: number;
  y: number;
  tabName: string;
};

type DraftState = {
  proje: string;
  tutar: string;
  tarih: string;
  kdvli: boolean;
  faturaKesildi: boolean;
  odemeAlindi: boolean;
};

type RowMeta = {
  createdAt: string;
  updatedAt: string;
};

type TabMeta = {
  icon: string;
  color: string;
};

type StoredState<T> = T;
type DropPosition = "before" | "after";

type InvoiceAttachment = {
  name: string;
  path: string;
  url: string;
  uploadedAt: string;
};

type PdfWindow = Window &
  typeof globalThis & {
    html2canvas?: (
      element: HTMLElement,
      options?: {
        scale?: number;
        useCORS?: boolean;
        backgroundColor?: string | null;
      }
    ) => Promise<HTMLCanvasElement>;
    jspdf?: {
      jsPDF: new (
        orientation: string,
        unit: string,
        format: string
      ) => {
        addImage: (
          imageData: string,
          format: string,
          x: number,
          y: number,
          width: number,
          height: number
        ) => void;
        addPage: () => void;
        save: (filename: string) => void;
      };
    };
  };

const PASSWORD = "";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mhoidirxbxqaktkhhavp.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_4M8RAgm3SzrWEMrxm8HDUw_3fRU8cMr";

const DEFAULT_ICONS = ["🎬", "💼", "🚴", "🎯", "📦", "🧾", "💡", "🎥", "📁"];
const DEFAULT_COLORS = [
  "#2563EB",
  "#0F766E",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#4F46E5",
  "#EA580C",
  "#16A34A",
];

const LIGHT = {
  appBg: "#050A14",
  sidebarBg: "#0B1626",
  contentBg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E6EBF2",
  text: "#1F2937",
  textSoft: "#374151",
  muted: "#6B7280",
  white: "#FFFFFF",
  blue: "#2563EB",
  blueSoft: "#EFF6FF",
  teal: "#0F766E",
  tealSoft: "#F0FDF9",
  amber: "#D97706",
  amberSoft: "#FFFBEB",
  red: "#DC2626",
  redSoft: "#FEF2F2",
  slateSoft: "#F8FAFC",
  shadow: "0 4px 12px rgba(0,0,0,0.04)",
  hero: "linear-gradient(135deg, #111827, #2563EB)",
};

const DARK = {
  appBg: "#030712",
  sidebarBg: "#08101D",
  contentBg: "#0B1220",
  card: "#111827",
  border: "#253041",
  text: "#E5E7EB",
  textSoft: "#CBD5E1",
  muted: "#94A3B8",
  white: "#FFFFFF",
  blue: "#3B82F6",
  blueSoft: "#0F1E37",
  teal: "#14B8A6",
  tealSoft: "#0B2623",
  amber: "#F59E0B",
  amberSoft: "#2A1E06",
  red: "#EF4444",
  redSoft: "#2C1114",
  slateSoft: "#0F172A",
  shadow: "0 8px 24px rgba(0,0,0,0.28)",
  hero: "linear-gradient(135deg, #0F172A, #1D4ED8)",
};

declare global {
  var __odeme_supabase__: ReturnType<typeof createClient> | undefined;
}

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

const readStoredInvoices = () =>
  readStoredState<Record<number, InvoiceAttachment[]>>("odeme-invoices-v1", {});

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "-");

const supabase =
  globalThis.__odeme_supabase__ ??
  createClient(supabaseUrl, supabaseKey);

if (!globalThis.__odeme_supabase__) {
  globalThis.__odeme_supabase__ = supabase;
}

const odemelerTable = () =>
  supabase.from("odemeler" as never) as ReturnType<typeof supabase.from>;

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
  const [giris, setGiris] = useState(true);
  const [sifre, setSifre] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

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
  });

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>("before");
  const [sortKey, setSortKey] = useState<SortKey>("manual");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
  const [invoiceMap, setInvoiceMap] = useState<Record<number, InvoiceAttachment[]>>(
    readStoredInvoices
  );
  const [invoiceTargetId, setInvoiceTargetId] = useState<number | null>(null);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<number | null>(null);

  const exportRef = useRef<HTMLElement | null>(null);
  const projectExportRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement | null>(null);
  const initialLoadRef = useRef(false);

  const palette = theme === "dark" ? DARK : LIGHT;

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
    localStorage.setItem("odeme-invoices-v1", JSON.stringify(invoiceMap));
  }, [invoiceMap]);

  useEffect(() => {
    initialLoadRef.current = false;
  }, [authUserId]);

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email && session.user.id) {
        setAuthEmail(session.user.email);
        setAuthUserId(session.user.id);
        setGiris(true);
      }
    };

    void run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email && session.user.id) {
        setAuthEmail(session.user.email);
        setAuthUserId(session.user.id);
        setGiris(true);
      } else {
        setAuthEmail(null);
        setAuthUserId(null);
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
            icon: DEFAULT_ICONS[index % DEFAULT_ICONS.length],
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

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSelectedIds([]);
  };

  const exportCSV = () => {
    const rows = viewMode === "home" ? filteredHomeRows : filteredActiveKayitlar;
    const headers = ["Sekme", "Proje", "Durum", "Fatura Tarihi", "Tutar"];

    const csvRows = rows.map((row) => [
      row.grup || "",
      row.proje || "",
      row.odendi
        ? "Ödeme alındı"
        : row.fatura_kesildi
          ? "Fatura kesildi"
          : "Bekliyor",
      row.fatura_tarihi || "",
      Number(row.tutar || 0),
    ]);

    const csv = [headers, ...csvRows]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      viewMode === "home"
        ? "odeme-paneli-genel.csv"
        : `${aktifSekme || "proje"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInvoicePicker = (rowId: number) => {
    setInvoiceTargetId(rowId);
    invoiceInputRef.current?.click();
  };

  const uploadInvoice = async (row: Odeme, file: File) => {
    if (!authUserId) return;

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

    setInvoiceMap((prev) => ({
      ...prev,
      [row.id]: [...(prev[row.id] || []), nextAttachment],
    }));

    setMsg("Fatura yüklendi.");
    setUploadingInvoiceId(null);
  };

  const removeInvoice = async (rowId: number, attachment: InvoiceAttachment) => {
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

  const exportJSON = () => {
    const rows = viewMode === "home" ? filteredHomeRows : filteredActiveKayitlar;
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      viewMode === "home"
        ? "odeme-paneli-genel.json"
        : `${aktifSekme || "proje"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file: File) => {
    if (!authUserId) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        setMsg("Geçersiz JSON formatı.");
        return;
      }

      const payload = parsed.map((item) => ({
        user_id: authUserId,
        proje: item.proje ?? null,
        tutar: item.tutar ?? null,
        odendi: item.odendi ?? false,
        grup: item.grup ?? aktifSekme ?? null,
        fatura_tarihi: item.fatura_tarihi ?? null,
        fatura_kesildi: item.fatura_kesildi ?? false,
        kdvli: item.kdvli ?? false,
        sira: item.sira ?? null,
      }));

      const { error } = await odemelerTable().insert(payload as never);

      if (error) {
        setMsg("JSON yüklenemedi: " + error.message);
        return;
      }

      setMsg("JSON başarıyla içe aktarıldı.");
      await yukle();
    } catch {
      setMsg("JSON okunamadı.");
    }
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

      const target =
        viewMode === "project" ? projectExportRef.current : exportRef.current;
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

    const payload = {
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
      ? await odemelerTable().update(payload as never).eq("id", editId)
      : await odemelerTable().insert([payload] as never);

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
        proje: `${row.proje || "Yeni Kayıt"} Kopya`,
        tutar: row.tutar,
        odendi: row.odendi,
        grup: row.grup,
        fatura_tarihi: row.fatura_tarihi,
        fatura_kesildi: row.fatura_kesildi,
        kdvli: row.kdvli,
        sira: nextSira,
      },
    ] as never);

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

    const { error } = await odemelerTable()
      .update(next as never)
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

    const promises = rows.map((row) => {
      if (type === "invoice") {
        return odemelerTable()
          .update({ fatura_kesildi: true, odendi: false } as never)
          .eq("id", row.id);
      }
      if (type === "paid") {
        return odemelerTable()
          .update({ fatura_kesildi: true, odendi: true } as never)
          .eq("id", row.id);
      }
      return odemelerTable().delete().eq("id", row.id);
    });

    const res = await Promise.all(promises);
    const failed = res.find((r) => r.error);

    if (failed?.error) {
      setMsg("Toplu işlem başarısız: " + failed.error.message);
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
    if (!lastDeleted?.length) return;

    const payload = lastDeleted.map((row) => ({
      proje: row.proje,
      tutar: row.tutar,
      odendi: row.odendi,
      grup: row.grup,
      fatura_tarihi: row.fatura_tarihi,
      fatura_kesildi: row.fatura_kesildi,
      kdvli: row.kdvli,
      sira: row.sira,
    }));

    const { error } = await odemelerTable().insert(payload as never);

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
    const { error } = await odemelerTable().delete().eq("id", id);

    if (error) {
      setMsg("Kayıt silinemedi: " + error.message);
      return;
    }

    setInvoiceMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

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
    const res = await Promise.all(
      rows.map((x) => odemelerTable().delete().eq("id", x.id))
    );

    const failed = res.find((r) => r.error);
    if (failed?.error) {
      setMsg("Sekme silinemedi: " + failed.error.message);
      return;
    }

    setInvoiceMap((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        delete next[row.id];
      });
      return next;
    });

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
          .update({ grup: yeniAd.trim() } as never)
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
        odemelerTable().update({ sira: i + 1 } as never).eq("id", row.id)
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

  const aktifTabMeta =
    tabMeta[aktifSekme] || {
      icon: "📁",
      color: "var(--blue)",
    };

  async function authLogin() {
    if (!email.trim() || !authPassword.trim()) return;

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

    setAuthMode("login");
    setMsg(
      "Hesap oluşturma isteği alındı. E-posta doğrulaması açıksa kutunu kontrol et, kapalıysa şimdi giriş yap."
    );
  }

  async function authLoginWithGoogle() {
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
  }

  function yeniProjeOlustur() {
    const ad = window.prompt("Proje adı");
    if (!ad || !ad.trim()) return;

    const clean = ad.trim();
    if (!tabMeta[clean]) {
      setTabMeta((prev) => ({
        ...prev,
        [clean]: {
          icon: DEFAULT_ICONS[Object.keys(prev).length % DEFAULT_ICONS.length],
          color: DEFAULT_COLORS[Object.keys(prev).length % DEFAULT_COLORS.length],
        },
      }));
    }

    openProjectTab(clean);
  }

  function sekmeGorunumDuzenle(tabName: string) {
    const current = tabMeta[tabName] || { icon: "📁", color: "#2563EB" };
    const yeniIcon = window.prompt("Emoji/ikon gir", current.icon) || current.icon;
    const yeniColor =
      window.prompt("Renk hex gir (#2563EB gibi)", current.color) || current.color;

    setTabMeta((prev) => ({
      ...prev,
      [tabName]: {
        icon: yeniIcon.trim() || current.icon,
        color: yeniColor.trim() || current.color,
      },
    }));
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
      <div style={styles.loginCard}>
        <div style={styles.badge}>ODEME PANELI</div>
        <h1 style={{ fontSize: 28, margin: "12px 0 8px", color: "var(--text)" }}>
          Giris
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: 14 }}>
          Sadece Google veya e-posta/sifre ile giris yapilabilir.
        </p>

        <div style={styles.loginSection}>
          <div style={styles.loginLabel}>Google</div>
          <button
            className="hover-button"
            onClick={() => void authLoginWithGoogle()}
            style={{ ...styles.primaryBtn, width: "100%", marginTop: 12 }}
          >
            Google ile Giris Yap
          </button>
        </div>

        <div style={styles.loginDivider} />

        <div style={styles.loginSection}>
          <div style={styles.loginLabel}>
            {authMode === "login" ? "E-posta ile Giris" : "Yeni Hesap"}
          </div>
          <input
            className="soft-input"
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            className="soft-input"
            type="password"
            placeholder="Sifre"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            style={{ ...styles.input, marginTop: 8 }}
          />
          <button
            className="hover-button"
            onClick={() => void (authMode === "login" ? authLogin() : authSignUp())}
            style={{ ...styles.secondaryBtn, width: "100%", marginTop: 12 }}
          >
            {authMode === "login" ? "Giris Yap" : "Hesap Olustur"}
          </button>
          <button
            className="hover-button"
            onClick={() => setAuthMode((prev) => (prev === "login" ? "signup" : "login"))}
            style={{ ...styles.secondaryBtn, width: "100%", marginTop: 8 }}
          >
            {authMode === "login" ? "Yeni hesap ac" : "Mevcut hesaba gir"}
          </button>
        </div>

        {msg ? <div style={{ ...styles.msg, marginTop: 14 }}>{msg}</div> : null}
      </div>
    </div>
  );

  if (!authUserId) {
    return renderAuthScreen();
  }

  if (!giris) {
    return (
      <div style={{ ...styles.loginWrap, ...themeVars }}>
        <div style={styles.loginCard}>
          <div style={styles.badge}>ÖDEME PANELİ</div>
          <h1 style={{ fontSize: 28, margin: "12px 0 8px", color: "var(--text)" }}>
            Giriş
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: 14 }}>
            İstersen panel şifresiyle, istersen Supabase hesabınla giriş yap.
          </p>

          <div style={styles.loginSection}>
            <div style={styles.loginLabel}>Hızlı Giriş</div>
            <input
              className="soft-input"
              type="password"
              placeholder="Panel şifresi"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && sifre === PASSWORD) setGiris(true);
              }}
              style={styles.input}
            />
            <button
              className="hover-button"
              onClick={() => sifre === PASSWORD && setGiris(true)}
              style={{ ...styles.primaryBtn, width: "100%", marginTop: 12 }}
            >
              Panel Şifresiyle Gir
            </button>
          </div>

          <div style={styles.loginDivider} />

          <div style={styles.loginSection}>
            <div style={styles.loginLabel}>Supabase Auth</div>
            <input
              className="soft-input"
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <input
              className="soft-input"
              type="password"
              placeholder="Şifre"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={{ ...styles.input, marginTop: 8 }}
            />
            <button
              className="hover-button"
              onClick={() => void authLogin()}
              style={{ ...styles.secondaryBtn, width: "100%", marginTop: 12 }}
            >
              Supabase ile Giriş Yap
            </button>
          </div>

          {msg ? <div style={{ ...styles.msg, marginTop: 14 }}>{msg}</div> : null}
        </div>
      </div>
    );
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
            <div style={styles.sidebarTitle}>Ödeme Paneli</div>
            <div style={styles.sidebarSub}>
              {authEmail ? authEmail : "Projeler"}
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
                {viewMode === "home" ? "Ana Sayfa" : aktifSekme || "Proje"}
              </h1>
              <div style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>
                {viewMode === "home"
                  ? "Tüm projelerin genel özeti"
                  : "Sekme detayları"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

          <div style={styles.heroCard}>
            <div style={styles.heroTopRow}>
              <div>
                <div style={styles.heroLabel}>
                  {viewMode === "home" ? "GENEL TOPLAM" : "PROJE TOPLAMI"}
                </div>
                <div style={styles.heroValue}>
                  {tl(viewMode === "home" ? tumToplam : toplam)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="no-print"
                  onClick={exportCSV}
                  style={styles.secondaryBtn}
                >
                  <span style={styles.btnInner}>
                    <Download size={16} />
                    CSV
                  </span>
                </button>

                <button
                  className="no-print"
                  onClick={exportJSON}
                  style={styles.secondaryBtn}
                >
                  <span style={styles.btnInner}>
                    <FileText size={16} />
                    JSON
                  </span>
                </button>

                <button
                  className="no-print"
                  onClick={() => importInputRef.current?.click()}
                  style={styles.secondaryBtn}
                >
                  <span style={styles.btnInner}>
                    <Upload size={16} />
                    JSON Yükle
                  </span>
                </button>

                <button
                  className="no-print"
                  onClick={exportPDF}
                  style={styles.primaryBtn}
                >
                  <span style={styles.btnInner}>
                    <FileText size={16} />
                    PDF
                  </span>
                </button>

                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await importJSON(file);
                    }
                    e.currentTarget.value = "";
                  }}
                />

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

          <div style={styles.filterBar} className="no-print">
            <div style={styles.searchWrap}>
              <Search size={16} color={palette.muted} />
              <input
                className="soft-input"
                placeholder="Proje veya sekme ara"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedIds([]);
                }}
                style={{
                  ...styles.input,
                  border: "none",
                  padding: 0,
                  background: "transparent",
                }}
              />
            </div>

            <div style={styles.filterGroup}>
              <Filter size={16} color={palette.muted} />
              <select
                className="soft-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setSelectedIds([]);
                }}
                style={styles.selectCompact}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="paid">Ödendi</option>
                <option value="invoiced">Fatura Kesildi</option>
                <option value="waiting">Bekliyor</option>
              </select>
            </div>

            <input
              className="soft-input"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setSelectedIds([]);
              }}
              style={styles.dateCompact}
            />

            <input
              className="soft-input"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setSelectedIds([]);
              }}
              style={styles.dateCompact}
            />

            <button
              className="hover-button"
              onClick={clearFilters}
              style={styles.secondaryBtn}
            >
              <span style={styles.btnInner}>
                <RotateCcw size={16} />
                Temizle
              </span>
            </button>
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
                <div style={styles.quickMuted}>
                  {aktifTabMeta.icon} bu sekmenin toplamı
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
                <h2 style={styles.h2}>Proje Performansı</h2>
                <BarChart3 size={18} color={palette.muted} />
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {homeProjectStats.map((item) => {
                  const meta = tabMeta[item.tab] || { icon: "📁", color: palette.blue };

                  return (
                    <div key={item.tab} style={styles.projectBarRow}>
                      <div style={styles.projectBarHead}>
                        <div>
                          <div style={styles.projectBarTitle}>
                            {meta.icon} {item.tab}
                          </div>
                          <div style={styles.projectBarMeta}>
                            {item.kayit} kayıt · {item.odenen} ödeme
                          </div>
                        </div>
                        <div style={styles.projectBarAmount}>{tl(item.toplam)}</div>
                      </div>

                      <div style={styles.progressWrapThin}>
                        <div
                          style={{
                            ...styles.progressBar,
                            width: `${item.oran}%`,
                            background: `linear-gradient(90deg, ${meta.color}, var(--teal))`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {homeProjectStats.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    Filtreye uygun proje bulunamadı.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {viewMode === "home" ? (
            <div style={styles.card}>
              <div style={styles.sectionHead}>
                <h2 style={styles.h2}>Genel Proje Özeti</h2>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {homeProjectStats.length} proje
                </div>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: "var(--blueSoft)" }}>PROJE</th>
                      <th style={{ ...styles.th, background: "var(--tealSoft)" }}>KAYIT</th>
                      <th style={{ ...styles.th, background: "var(--amberSoft)" }}>ÖDEME</th>
                      <th style={{ ...styles.th, background: "var(--redSoft)" }}>FATURA</th>
                      <th style={{ ...styles.th, background: "var(--slateSoft)" }}>TOPLAM</th>
                    </tr>
                  </thead>

                  <tbody>
                    {homeProjectStats.map((item) => {
                      const meta = tabMeta[item.tab] || { icon: "📁", color: palette.blue };

                      return (
                        <tr key={item.tab}>
                          <td style={{ ...styles.td, borderLeft: `5px solid ${meta.color}` }}>
                            {meta.icon} {item.tab}
                          </td>
                          <td style={styles.td}>{item.kayit}</td>
                          <td style={styles.td}>{item.odenen}</td>
                          <td style={styles.td}>{item.fatura}</td>
                          <td style={{ ...styles.td, fontWeight: 700 }}>
                            {tl(item.toplam)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.card} ref={projectExportRef}>
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
                  <h2 style={styles.h2}>
                    {aktifTabMeta.icon} Kayıtlar
                  </h2>
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
                        <th style={{ ...styles.th, width: 52 }} className="no-print">
                          SEÇ
                        </th>
                        <th
                          style={{
                            ...styles.th,
                            background: "var(--slateSoft)",
                            cursor: "pointer",
                            width: 70,
                          }}
                          onClick={() => {
                            setSortKey("manual");
                            setSortDirection("asc");
                          }}
                        >
                          SIRA {sortKey === "manual" ? "●" : ""}
                        </th>

                        <th
                          style={{
                            ...styles.th,
                            background: "var(--blueSoft)",
                            cursor: "pointer",
                          }}
                          onClick={() => sortToggle("proje")}
                        >
                          PROJE {arrow("proje")}
                        </th>

                        <th
                          style={{
                            ...styles.th,
                            background: "var(--tealSoft)",
                            cursor: "pointer",
                          }}
                          onClick={() => sortToggle("durum")}
                        >
                          DURUM {arrow("durum")}
                        </th>

                        <th
                          style={{
                            ...styles.th,
                            background: "var(--amberSoft)",
                            cursor: "pointer",
                          }}
                          onClick={() => sortToggle("fatura_tarihi")}
                        >
                          FATURA TARİHİ {arrow("fatura_tarihi")}
                        </th>

                        <th
                          style={{
                            ...styles.th,
                            background: "var(--redSoft)",
                            cursor: "pointer",
                          }}
                          onClick={() => sortToggle("tutar")}
                        >
                          TUTAR {arrow("tutar")}
                        </th>

                        <th
                          style={{ ...styles.th, width: 160 }}
                          className="no-print"
                        >
                          İŞLEM
                        </th>
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
                            <td style={{ ...styles.td, width: 52 }} className="no-print">
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

                            <td
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
                                cursor:
                                  sortKey === "manual" ? "grab" : "default",
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

                            <td
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
                                  <div style={{ fontWeight: 800 }}>
                                    {row.proje || "—"}
                                  </div>
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

                            <td style={styles.td}>
                              {editing ? (
                                <select
                                  className="soft-input"
                                  value={
                                    odemeAlindi
                                      ? "odeme"
                                      : faturaKesildi
                                        ? "fatura"
                                        : "bekliyor"
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setOdemeAlindi(v === "odeme");
                                    setFaturaKesildi(
                                      v === "fatura" || v === "odeme"
                                    );
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

                            <td
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

                            <td
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
                                    onChange={(e) =>
                                      setKdvli(e.target.value === "kdvli")
                                    }
                                    style={styles.input}
                                  >
                                    <option value="kdvsiz">KDV’siz</option>
                                    <option value="kdvli">+ %20 KDV</option>
                                  </select>
                                  <button
                                    className="hover-button"
                                    onClick={kaydet}
                                    style={styles.secondaryBtn}
                                  >
                                    Kaydet
                                  </button>
                                  <button
                                    className="hover-button"
                                    onClick={temizle}
                                    style={styles.deleteBtn}
                                  >
                                    İptal
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div>
                                    {row.tutar ? tl(Number(row.tutar)) : "—"}
                                  </div>
                                  {row.kdvli ? (
                                    <div style={styles.metaText}>+ %20 KDV</div>
                                  ) : null}
                                </div>
                              )}
                            </td>

                            <td style={styles.td} className="no-print">
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
              setTabMenu((p) => ({ ...p, visible: false }));
              sekmeGorunumDuzenle(tabMenu.tabName);
            }}
          >
            <span style={styles.btnInner}>
              <Palette size={14} />
              Renk / Emoji
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
  filterBar: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    boxShadow: "var(--shadow)",
  },
  searchWrap: {
    minWidth: 240,
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: "var(--slateSoft)",
    border: "1px solid var(--border)",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: "var(--slateSoft)",
    border: "1px solid var(--border)",
  },
  selectCompact: {
    border: "none",
    background: "transparent",
    fontSize: 13,
    color: "var(--text)",
    outline: "none",
  },
  dateCompact: {
    width: 160,
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
  loginWrap: {
    minHeight: "100vh",
    background: "var(--appBg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: 'Inter, "SF Pro Display", Arial, sans-serif',
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "var(--shadow)",
  },
  loginSection: {
    display: "grid",
    gap: 8,
  },
  loginLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text)",
  },
  loginDivider: {
    height: 1,
    background: "var(--border)",
    margin: "16px 0",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--blueSoft)",
    color: "var(--blue)",
    fontWeight: 800,
    fontSize: 11,
  },
};
