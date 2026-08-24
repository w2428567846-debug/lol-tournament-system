import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Account } from '@/types';

export type Viewer = {
  configured: boolean;
  sessionUser: User | null;
  account: Account | null;
  isAdmin: boolean;
};

type AccountRow = Record<string, unknown>;

function mapAccount(row: AccountRow): Account {
  return {
    id: String(row.id),
    authProvider: row.auth_provider as Account['authProvider'],
    role: row.role as Account['role'],
    wechatNickname: row.wechat_nickname == null ? null : String(row.wechat_nickname),
    wechatAvatarUrl: row.wechat_avatar_url == null ? null : String(row.wechat_avatar_url),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function loadAccount(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data, error } = await supabase.rpc('current_account_summary');
  if (error || !data) return null;
  return mapAccount(data as AccountRow);
}

export async function getViewer(): Promise<Viewer> {
  if (!isSupabaseConfigured()) return { configured: false, sessionUser: null, account: null, isAdmin: false };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { configured: true, sessionUser: null, account: null, isAdmin: false };
    const account = await loadAccount(supabase);
    return { configured: true, sessionUser: user, account, isAdmin: account?.role === 'ADMIN' };
  } catch {
    return { configured: true, sessionUser: null, account: null, isAdmin: false };
  }
}

export async function getAuthenticatedClient() {
  if (!isSupabaseConfigured()) return { error: 'SUPABASE_NOT_CONFIGURED' as const };
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'AUTH_REQUIRED' as const };
  const account = await loadAccount(supabase);
  if (!account) return { error: 'ACCOUNT_REQUIRED' as const };
  return { supabase, sessionUser: user, account };
}

export async function getAdminClient() {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return authenticated;
  if (authenticated.account.role !== 'ADMIN') return { error: 'ADMIN_REQUIRED' as const };
  return authenticated;
}
