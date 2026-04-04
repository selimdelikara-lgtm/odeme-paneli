import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mhoidirxbxqaktkhhavp.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_4M8RAgm3SzrWEMrxm8HDUw_3fRU8cMr";

const AUTH_STORAGE_PREFERENCE_KEY = "odeme-auth-storage";

const authStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;

    const preference =
      window.localStorage.getItem(AUTH_STORAGE_PREFERENCE_KEY) ?? "local";
    const targetStorage =
      preference === "session" ? window.sessionStorage : window.localStorage;
    const otherStorage =
      preference === "session" ? window.localStorage : window.sessionStorage;

    targetStorage.setItem(key, value);
    otherStorage.removeItem(key);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  },
};

declare global {
  var __odeme_supabase__: SupabaseClient<Database> | undefined;
}

export const createBrowserSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

export const setAuthStoragePreference = (remember: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    AUTH_STORAGE_PREFERENCE_KEY,
    remember ? "local" : "session"
  );
};

export const browserSupabase =
  globalThis.__odeme_supabase__ ?? createBrowserSupabaseClient();

if (!globalThis.__odeme_supabase__) {
  globalThis.__odeme_supabase__ = browserSupabase;
}

export { supabaseUrl, supabaseKey };
