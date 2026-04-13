import { browserSupabase as supabase } from "@/lib/supabase";
import {
  ALLOWED_INVOICE_EXTENSIONS,
  ALLOWED_INVOICE_MIME_TYPES,
  HOME_PROJECT_COLUMN_ORDER_DEFAULT,
  PROJECT_COLUMN_ORDER_DEFAULT,
  type HomeProjectColumnKey,
  type ImportedDraftRow,
  type Odeme,
  type ProjectColumnKey,
  type StoredState,
  type ThemeMode,
} from "./page.shared";

export const readStoredState = <T,>(key: string, fallback: T): StoredState<T> => {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const readStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem("odeme-theme-v1");
  return savedTheme === "dark" ? "dark" : "light";
};

export const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "-");

export const isAllowedInvoiceFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_INVOICE_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasAllowedMime =
    !file.type ||
    ALLOWED_INVOICE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_INVOICE_MIME_TYPES)[number]
    );

  return hasAllowedExtension && hasAllowedMime;
};

const OCR_MONTH_MAP: Record<string, string> = {
  ocak: "01",
  subat: "02",
  şubat: "02",
  mart: "03",
  nisan: "04",
  mayis: "05",
  mayıs: "05",
  haziran: "06",
  temmuz: "07",
  agustos: "08",
  ağustos: "08",
  eylul: "09",
  eylül: "09",
  ekim: "10",
  kasim: "11",
  kasım: "11",
  aralik: "12",
  aralık: "12",
};

const normalizeOcrText = (input: string) =>
  input
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/[|]/g, " ")
    .replace(/["“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeForLookup = (input: string) =>
  input
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

const parseKAmount = (input: string) => {
  const match = input.match(/(\d+(?:[.,]\d+)?)\s*K/i);
  if (!match) return null;
  return Number(match[1].replace(",", ".")) * 1000;
};

const parseStatus = (input: string) => {
  const normalized = normalizeForLookup(input);
  if (normalized.includes("odemesi alindi")) {
    return {
      rawStatus: "Ödemesi alındı",
      faturaKesildi: true,
      odemeAlindi: true,
    };
  }

  if (normalized.includes("fatura kesildi")) {
    return {
      rawStatus: "Fatura kesildi",
      faturaKesildi: true,
      odemeAlindi: false,
    };
  }

  return {
    rawStatus: "Henüz fatura kesilmedi",
    faturaKesildi: false,
    odemeAlindi: false,
  };
};

const parseDateLabel = (input: string, currentYear = new Date().getFullYear()) => {
  const normalized = normalizeForLookup(input);
  const match = normalized.match(
    /(\d{1,2})\s+(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)/i
  );
  if (!match) return "";
  const month = OCR_MONTH_MAP[match[2].toLowerCase()];
  if (!month) return "";
  return `${currentYear}-${month}-${match[1].padStart(2, "0")}`;
};

export const parsePaymentTableFromOcr = (rawText: string): ImportedDraftRow[] => {
  const compact = normalizeOcrText(rawText);
  if (!compact) return [];

  const rows =
    compact.match(/B(?:ö|o)l(?:ü|u)m\s*\d+.*?(?=B(?:ö|o)l(?:ü|u)m\s*\d+|$)/gi) || [];

  return rows
    .map((rowText) => {
      const projeMatch = rowText.match(/B(?:ö|o)l(?:ü|u)m\s*\d+/i);
      const amountMatch = rowText.match(
        /(\d+(?:[.,]\d+)?)\s*K(?:\s*\+\s*%20\s*KDV)?/i
      );
      const status = parseStatus(rowText);
      const amountLabel = amountMatch
        ? amountMatch[0].replace(/\s+/g, " ").trim()
        : "—";
      const date = parseDateLabel(rowText);

      return {
        proje: projeMatch?.[0]?.replace(/\s+/g, " ").trim() || "",
        tutar: amountLabel === "—" ? null : parseKAmount(amountLabel),
        tarih: date,
        kdvli: /\+\s*%20\s*KDV/i.test(rowText),
        faturaKesildi: status.faturaKesildi,
        odemeAlindi: status.odemeAlindi,
        amountLabel,
        rawStatus: status.rawStatus,
      } satisfies ImportedDraftRow;
    })
    .filter((row) => row.proje);
};

export const isProjectColumnKey = (value: string): value is ProjectColumnKey =>
  PROJECT_COLUMN_ORDER_DEFAULT.includes(value as ProjectColumnKey);

export const isHomeProjectColumnKey = (
  value: string
): value is HomeProjectColumnKey =>
  HOME_PROJECT_COLUMN_ORDER_DEFAULT.includes(value as HomeProjectColumnKey);

export const odemelerTable = () => supabase.from("odemeler");

export const faturaEkleriTable = () => supabase.from("fatura_ekleri");

export const tl = (v: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);

export const shortDate = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
};

export const shortDateTime = (v: string | null) => {
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

export const dateValue = (v: string | null) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export const durumScore = (i: Odeme) => (i.odendi ? 2 : i.fatura_kesildi ? 1 : 0);

export const loadScript = (src: string) =>
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
