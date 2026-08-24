import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CancelRegistrationButton } from '@/components/account/cancel-registration-button';
import { ProfileForm } from '@/components/account/profile-form';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { StatusBadge } from '@/components/registration/status-badge';
import { SetupRequired } from '@/components/supabase/setup-required';
import { getViewer } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/format';
import { getAccountOverview } from '@/lib/registrations/queries';

export const metadata: Metadata = { title: '我的账户' };
export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer.configured) return <main className="min-h-screen bg-[#080b10] text-white"><SiteHeader /><SetupRequired /><SiteFooter /></main>;
  if (!viewer.sessionUser || !viewer.account) redirect('/login?returnTo=/account');

  const params = await searchParams;
  const { profile, registrations } = await getAccountOverview(viewer.account.id);
  const accountLabel = viewer.account.authProvider === 'WECHAT'
    ? viewer.account.wechatNickname ?? '微信用户'
    : viewer.sessionUser.email ?? '开发测试账户';

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <section className="border-b border-white/8 bg-[#0a0e14]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-10">
          <div><p className="text-[10px] font-black uppercase tracking-[.28em] text-[#d8b968]">My account</p><h1 className="mt-2 text-4xl font-black tracking-[-.04em]">玩家账户</h1><p className="mt-3 text-sm text-slate-500">{accountLabel} · {viewer.account.authProvider === 'WECHAT' ? '微信已验证' : '开发测试身份'}</p></div>
          <form action="/auth/signout" method="post"><button className="border border-white/12 px-5 py-2.5 text-xs font-bold text-slate-300">退出登录</button></form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-12 sm:px-8 lg:px-10">
        {params.error === 'admin_required' ? <p className="border border-red-300/20 bg-red-300/7 px-5 py-4 text-sm text-red-200">当前账户没有管理员权限。</p> : null}
        {params.registered ? <p className="border border-emerald-300/20 bg-emerald-300/7 px-5 py-4 text-sm text-emerald-200">报名已提交，主办方审核后会在这里更新状态。</p> : null}
        {params.updated ? <p className="border border-emerald-300/20 bg-emerald-300/7 px-5 py-4 text-sm text-emerald-200">报名资料已更新；如修改了关键资料，状态会回到等待审核。</p> : null}

        <section className="border border-white/9 bg-[#0d1219] p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.25em] text-[#d8b968]">My profile</p>
          <h2 className="mt-2 text-2xl font-black">常用报名资料</h2>
          <p className="mt-2 text-sm text-slate-500">这是可选的预填资料，不会阻挡首次报名，也不会改写已提交的赛事记录。</p>
          <ProfileForm profile={profile} />
        </section>

        <section>
          <div className="flex items-end justify-between border-b border-white/8 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-[#d8b968]">My registrations</p><h2 className="mt-2 text-2xl font-black">我的报名</h2></div><Link href="/tournaments" className="text-xs font-bold text-[#d8b968]">浏览赛事 →</Link></div>
          {registrations.length === 0 ? <div className="mt-6 border border-dashed border-white/12 p-8 text-center text-sm text-slate-500">还没有报名记录。</div> : (
            <div className="mt-6 space-y-4">
              {registrations.map((registration) => (
                <article key={registration.id} className="grid gap-5 border border-white/9 bg-[#0d1219] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3"><Link href={`/tournaments/${registration.tournament.slug}`} className="text-lg font-black text-white hover:text-[#d8b968]">{registration.tournament.name}</Link><StatusBadge status={registration.status} /></div>
                    <p className="mt-3 text-sm text-slate-300">游戏 ID：<strong className="text-white">{registration.gameId}</strong></p>
                    <p className="mt-1 text-sm text-slate-400">段位：{registration.rankSnapshot} · 位置：<strong className="text-slate-200">{registration.primaryRole}{registration.secondaryRole ? ` / ${registration.secondaryRole}` : ''}</strong></p>
                    <p className="mt-1 text-xs text-slate-600">提交：{formatDateTime(registration.createdAt)}</p>
                  </div>
                  {registration.canSelfManage ? <div className="flex items-center gap-4"><Link href={`/tournaments/${registration.tournament.slug}/register`} className="text-xs font-bold text-[#d8b968]">修改报名</Link><CancelRegistrationButton registrationId={registration.id} /></div> : <span className="text-xs text-slate-600">报名已关闭或不可修改</span>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
