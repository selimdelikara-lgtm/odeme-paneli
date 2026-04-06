import { browserSupabase as supabase } from "@/lib/supabase";
import {
  ALLOWED_INVOICE_EXTENSIONS,
  ALLOWED_INVOICE_MIME_TYPES,
  HOME_PROJECT_COLUMN_ORDER_DEFAULT,
  PROJECT_COLUMN_ORDER_DEFAULT,
  type HomeProjectColumnKey,
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
    !file.type || ALLOWED_INVOICE_MIME_TYPES.includes(file.type as (typeof ALLOWED_INVOICE_MIME_TYPES)[number]);

  return hasAllowedExtension && hasAllowedMime;
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
