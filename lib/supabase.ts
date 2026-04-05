import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://missing-supabase-project.invalid";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-anon-key";

const AUTH_STORAGE_PREFERENCE_KEY = "odeme-auth-storage";
const SUPABASE_STORAGE_KEY_PREFIX = "sb-";

const moveSupabaseSessionKeys = (remember: boolean) => {
  if (typeof window === "undefined") return;

  const sourceStorage = remember ? window.sessionStorage : window.localStorage;
  const targetStorage = remember ? window.localStorage : window.sessionStorage;

  for (let index = 0; index < sourceStorage.length; index += 1) {
    const key = sourceStorage.key(index);
    if (!key || !key.startsWith(SUPABASE_STORAGE_KEY_PREFIX)) continue;

    const value = sourceStorage.getItem(key);
    if (value === null) continue;
    targetStorage.setItem(key, value);
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < sourceStorage.length; index += 1) {
    const key = sourceStorage.key(index);
    if (key && key.startsWith(SUPABASE_STORAGE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sourceStorage.removeItem(key));
};

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
  moveSupabaseSessionKeys(remember);
};

export const browserSupabase =
  globalThis.__odeme_supabase__ ?? createBrowserSupabaseClient();

if (!globalThis.__odeme_supabase__) {
  globalThis.__odeme_supabase__ = browserSupabase;
}

export { supabaseUrl, supabaseKey };
