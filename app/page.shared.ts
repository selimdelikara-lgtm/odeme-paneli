export type Odeme = {
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

export type ViewMode = "home" | "project" | "settings";
export type SortKey = "manual" | "proje" | "durum" | "fatura_tarihi" | "tutar";
export type SortDirection = "asc" | "desc";
export type StatusFilter = "all" | "paid" | "invoiced" | "waiting";
export type ThemeMode = "light" | "dark";

export type TabMenu = {
  visible: boolean;
  x: number;
  y: number;
  tabName: string;
  mode: "menu" | "colors";
};

export type DraftState = {
  proje: string;
  tutar: string;
  tarih: string;
  kdvli: boolean;
  faturaKesildi: boolean;
  odemeAlindi: boolean;
};

export type RowMeta = {
  createdAt: string;
  updatedAt: string;
};

export type TabMeta = {
  color: string;
};

export type StoredState<T> = T;
export type DropPosition = "before" | "after";
export type ProjectColumnKey =
  | "select"
  | "sira"
  | "proje"
  | "durum"
  | "fatura_tarihi"
  | "tutar"
  | "islem";

export type HomeProjectColumnKey =
  | "proje"
  | "kayit"
  | "odeme"
  | "fatura"
  | "toplam";

export type InvoiceAttachment = {
  id?: number;
  name: string;
  path: string;
  url: string;
  uploadedAt: string;
};

export type PdfWindow = Window &
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

export const DEFAULT_COLORS = [
  "#2563EB",
  "#0F766E",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#4F46E5",
  "#EA580C",
  "#16A34A",
  "#E11D48",
  "#9333EA",
  "#0EA5E9",
  "#14B8A6",
  "#84CC16",
  "#F97316",
  "#F59E0B",
  "#64748B",
  "#111827",
  "#EC4899",
  "#22C55E",
  "#06B6D4",
] as const;

export const MAX_INVOICE_FILE_SIZE_MB = 1;
export const MAX_INVOICE_FILE_SIZE_BYTES = MAX_INVOICE_FILE_SIZE_MB * 1024 * 1024;

export const PROJECT_COLUMN_ORDER_DEFAULT: ProjectColumnKey[] = [
  "select",
  "sira",
  "proje",
  "durum",
  "fatura_tarihi",
  "tutar",
  "islem",
];

export const HOME_PROJECT_COLUMN_ORDER_DEFAULT: HomeProjectColumnKey[] = [
  "proje",
  "kayit",
  "odeme",
  "fatura",
  "toplam",
];

export const LIGHT = {
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

export const DARK = {
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
