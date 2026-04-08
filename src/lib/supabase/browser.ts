"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

let browserClient: SupabaseClient | undefined;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        auth: {
          detectSessionInUrl: false,
        },
      },
    );
  }

  return browserClient;
}
