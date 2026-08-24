import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { TournamentRegistrationForm } from '@/components/registration/tournament-registration-form';
import { SetupRequired } from '@/components/supabase/setup-required';
import { getViewer } from '@/lib/auth/server';
import { getAccountTournamentRegistration, getSavedProfile } from '@/lib/registrations/queries';
import { registrationStatusLabels } from '@/lib/registrations/labels';
import { getTournamentDetail } from '@/lib/tournaments/queries';
import { isTournamentRegistrationOpen } from '@/lib/tournaments/registration';

export const metadata: Metadata = { title: '赛事报名' };
export const dynamic = 'force-dynamic';

export default async function TournamentRegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer.configured) return <main className="min-h-screen bg-[#080b10] text-white"><SiteHeader /><SetupRequired /><SiteFooter /></main>;
  if (!viewer.sessionUser || !viewer.account) redirect(`/login?returnTo=${encodeURIComponent(`/tournaments/${slug}/register`)}`);

  const { tournament } = await getTournamentDetail(slug);
  if (!tournament) notFound();

  const [profile, registration] = await Promise.all([
    getSavedProfile(viewer.account.id),
    getAccountTournamentRegistration(viewer.account.id, tournament.id),
  ]);

  const open = isTournamentRegistrationOpen(tournament);
  const editableRegistration = registration && ['PENDING', 'APPROVED', 'WAITLISTED'].includes(registration.status)
    ? registration
    : null;

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <Link href={`/tournaments/${tournament.slug}`} className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">← 返回赛事详情</Link>
        <div className="mt-6 border border-white/10 bg-[#0d1219] p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.28em] text-[#d8b968]">Solo registration</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">{editableRegistration ? '修改报名' : '报名'} {tournament.name}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">直接填写本次赛事资料即可提交，不需要先建立选手档案。资料会保存为赛事快照。</p>
          {!open ? <p className="mt-7 border border-amber-300/20 bg-amber-300/6 p-5 text-sm text-amber-100">报名已经关闭或名单已锁定，当前不能提交或修改。</p> : registration && !editableRegistration ? <p className="mt-7 border border-slate-300/15 bg-white/[.03] p-5 text-sm text-slate-300">你已有一份状态为“{registrationStatusLabels[registration.status]}”的报名记录，不能重复提交。</p> : <TournamentRegistrationForm tournament={tournament} profile={profile} registration={editableRegistration} />}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
