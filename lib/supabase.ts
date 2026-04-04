import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mhoidirxbxqaktkhhavp.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_4M8RAgm3SzrWEMrxm8HDUw_3fRU8cMr";

declare global {
  var __odeme_supabase__: SupabaseClient<Database> | undefined;
}

export const createBrowserSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseKey);

export const browserSupabase =
  globalThis.__odeme_supabase__ ?? createBrowserSupabaseClient();

if (!globalThis.__odeme_supabase__) {
  globalThis.__odeme_supabase__ = browserSupabase;
}

export { supabaseUrl, supabaseKey };
