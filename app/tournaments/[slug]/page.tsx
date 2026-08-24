import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { SetupRequired } from '@/components/supabase/setup-required';
import { formatDateRange, formatDateTime } from '@/lib/format';
import { getTournamentDetail } from '@/lib/tournaments/queries';
import { isTournamentRegistrationOpen } from '@/lib/tournaments/registration';
import { tournamentStatusDescriptions, tournamentStatusLabels } from '@/lib/tournaments/status';
import { tournamentFormatLabels, tournamentRegistrationTypeLabels, tournamentVisibilityLabels } from '@/lib/tournaments/labels';
import { playerRoleLabels } from '@/lib/registrations/labels';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { tournament, configurationMissing } = await getTournamentDetail(slug);
  if (configurationMissing) return { title: '赛事服务暂不可用' };
  if (!tournament) return { title: '赛事不存在' };
  const description = tournament.description.slice(0, 150);
  return {
    title: tournament.name,
    description,
    openGraph: { title: tournament.name, description, images: [] },
    twitter: { card: 'summary', title: tournament.name, description, images: [] },
  };
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, isFallback, configurationMissing } = await getTournamentDetail(slug);
  if (configurationMissing) return <main className="min-h-screen bg-[#080b10] text-white"><SiteHeader /><SetupRequired /><SiteFooter /></main>;
  if (!tournament) notFound();

  const registrationOpen = isTournamentRegistrationOpen(tournament);

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-white/8 bg-[#0a0e14]">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="flex flex-wrap items-center gap-3"><span className="bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">{tournamentStatusLabels[tournament.status]}</span><span className="border border-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-slate-500">{tournamentVisibilityLabels[tournament.visibility]}</span><span className="text-[10px] font-bold tracking-[.12em] text-[#d8b968]">{tournamentRegistrationTypeLabels[tournament.registrationType]}</span></div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.05em] sm:text-6xl">{tournament.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">{tournament.description}</p>
          <div className="mt-8 flex flex-wrap gap-7 text-sm"><Info label="比赛日期" value={formatDateRange(tournament.startAt, tournament.endAt, tournament.timezone)} /><Info label="赛制" value={`${tournamentFormatLabels[tournament.format]} · BO${tournament.defaultBestOf}`} /><Info label="选手上限" value={tournament.playerLimit ? `${tournament.playerLimit} 人` : '未限制'} /></div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="space-y-10">
          {isFallback ? <p className="border border-amber-300/20 bg-amber-300/6 px-5 py-4 text-sm text-amber-100">当前为开发示例。连接 Supabase 后，这里会显示真实报名数量与参与者。</p> : null}
          <section><SectionTitle eyebrow="Registration" title="报名信息" /><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric value={String(tournament.approvedCount)} label="已通过" /><Metric value={String(tournament.pendingCount)} label="待审核" /><Metric value={String(tournament.waitlistedCount)} label="候补" /><Metric value={tournament.playerLimit ? String(tournament.playerLimit) : '∞'} label="正式名额" /></div><p className="mt-5 text-sm leading-6 text-slate-500">报名时间：{formatDateTime(tournament.registrationStartAt, tournament.timezone)} — {formatDateTime(tournament.registrationEndAt, tournament.timezone)}（中国标准时间）</p></section>
          <section><SectionTitle eyebrow="Rules" title="赛事规则" /><div className="mt-5 whitespace-pre-line border border-white/9 bg-[#0d1219] p-6 text-sm leading-7 text-slate-400">{tournament.rules || '请遵守社区赛事公告与主办方临场安排。'}</div></section>
          <section><SectionTitle eyebrow="Participants" title="参与者预览" />{tournament.participantsRestricted ? <div className="mt-5 border border-dashed border-white/12 p-7 text-sm leading-6 text-slate-500">这是群内赛事。登录后才可查看已通过选手资料；报名人数仍会正常显示。</div> : tournament.participants.length === 0 ? <div className="mt-5 border border-dashed border-white/12 p-7 text-sm text-slate-600">暂未公布已通过选手。</div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{tournament.participants.map((participant) => <article key={`${participant.gameId}-${participant.primaryRole}`} className="border border-white/9 bg-[#0d1219] p-5"><p className="font-black text-white">{participant.gameId}</p><p className="mt-2 text-xs text-slate-500">{playerRoleLabels[participant.primaryRole]} · {participant.rank}</p></article>)}</div>}</section>
        </div>
        <aside>
          <div className="sticky top-6 border border-[#d8b968]/25 bg-[linear-gradient(145deg,rgba(216,185,104,.12),rgba(13,18,25,.98)_52%)] p-6">
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-[#d8b968]">Registration status</p>
            <h2 className="mt-3 text-2xl font-black">{registrationOpen ? '报名正在进行' : '当前不可报名'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{registrationOpen ? (tournament.visibility === 'PRIVATE' ? '这是私人赛事，请准备群内公布的邀请码。' : '登录后直接填写本次赛事资料即可提交。') : tournamentStatusDescriptions[tournament.status]}</p>
            {registrationOpen ? <Link href={`/tournaments/${tournament.slug}/register`} className="gold-button mt-6 flex min-h-12 items-center justify-center px-6 text-sm font-black tracking-[.12em] text-[#080b10]">立即报名 →</Link> : null}
            <Link href="/account" className="mt-3 flex min-h-11 items-center justify-center border border-white/12 text-xs font-bold text-slate-300">查看我的报名</Link>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] uppercase tracking-[.18em] text-slate-600">{label}</p><p className="mt-1 font-bold text-slate-200">{value}</p></div>; }
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-[10px] font-black uppercase tracking-[.28em] text-[#d8b968]">{eyebrow}</p><h2 className="mt-2 text-2xl font-black">{title}</h2></div>; }
function Metric({ value, label }: { value: string; label: string }) { return <div className="border border-white/9 bg-[#0d1219] p-5"><p className="text-3xl font-black text-white">{value}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">{label}</p></div>; }
