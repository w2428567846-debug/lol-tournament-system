import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { TournamentRegistrationForm } from '@/components/registration/tournament-registration-form';
import { SetupRequired } from '@/components/supabase/setup-required';
import { getViewer } from '@/lib/auth/server';
import { getAccountOverview } from '@/lib/registrations/queries';
import { getTournamentDetail } from '@/lib/tournaments/queries';
import { isTournamentRegistrationOpen } from '@/lib/tournaments/registration';

export const metadata: Metadata = { title: '赛事报名' };
export const dynamic = 'force-dynamic';

export default async function TournamentRegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer.configured) return <main className="min-h-screen bg-[#080b10] text-white"><SiteHeader /><SetupRequired /><SiteFooter /></main>;
  if (!viewer.user) redirect(`/login?returnTo=${encodeURIComponent(`/tournaments/${slug}/register`)}`);

  const [{ tournament }, account] = await Promise.all([getTournamentDetail(slug), getAccountOverview(viewer.user.id)]);
  if (!tournament) notFound();

  const open = isTournamentRegistrationOpen(tournament);

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <Link href={`/tournaments/${tournament.slug}`} className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">← 返回赛事详情</Link>
        <div className="mt-6 border border-white/10 bg-[#0d1219] p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.28em] text-[#d8b968]">Solo registration</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">报名 {tournament.name}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">提交后状态为等待审核。主办方会在后台处理，结果可在账户页查看。</p>
          {!open ? <p className="mt-7 border border-amber-300/20 bg-amber-300/6 p-5 text-sm text-amber-100">当前不在报名时间内。</p> : !account.profile ? <div className="mt-7 border border-cyan-300/20 bg-cyan-300/6 p-5"><p className="text-sm text-cyan-100">报名之前需要先完成选手档案。</p><Link href="/account" className="mt-4 inline-flex text-xs font-black text-[#d8b968]">前往创建档案 →</Link></div> : <TournamentRegistrationForm tournament={tournament} profile={account.profile} />}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
