'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabasePublicConfig } from '@/lib/supabase/config';

export function createBrowserSupabaseClient(config: SupabasePublicConfig) {
  return createBrowserClient(config.url, config.anonKey);
}
