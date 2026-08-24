import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { SetupRequired } from '@/components/supabase/setup-required';
import { getViewer } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.configured) return <AdminShell configured={false}><main className="p-5 sm:p-8"><SetupRequired compact /></main></AdminShell>;
  if (!viewer.sessionUser || !viewer.account) redirect('/login?returnTo=/admin');
  if (!viewer.isAdmin) redirect('/account?error=admin_required');
  const accountLabel = viewer.account.authProvider === 'WECHAT' ? viewer.account.wechatNickname ?? '微信管理员' : viewer.sessionUser.email ?? '开发管理员';
  return <AdminShell userLabel={accountLabel}>{children}</AdminShell>;
}
