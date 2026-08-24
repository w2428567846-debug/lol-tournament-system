import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type Viewer = {
  configured: boolean;
  user: User | null;
  isAdmin: boolean;
};

export async function getViewer(): Promise<Viewer> {
  if (!isSupabaseConfigured()) return { configured: false, user: null, isAdmin: false };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { configured: true, user: null, isAdmin: false };

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    return { configured: true, user, isAdmin: data?.role === 'ADMIN' };
  } catch {
    return { configured: true, user: null, isAdmin: false };
  }
}

export async function getAuthenticatedClient() {
  if (!isSupabaseConfigured()) return { error: 'SUPABASE_NOT_CONFIGURED' as const };
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'AUTH_REQUIRED' as const };
  return { supabase, user };
}

export async function getAdminClient() {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return authenticated;

  const { data } = await authenticated.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authenticated.user.id)
    .maybeSingle();

  if (data?.role !== 'ADMIN') return { error: 'ADMIN_REQUIRED' as const };
  return authenticated;
}
