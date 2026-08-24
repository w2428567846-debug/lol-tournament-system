import Link from 'next/link';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { SetupRequired } from '@/components/supabase/setup-required';
import { formatDateTime } from '@/lib/format';
import { getFeaturedTournament } from '@/lib/tournaments/queries';
import { getTournamentRegistrationPhase, tournamentRegistrationPhaseLabels } from '@/lib/tournaments/domain';

export default async function HomePage() {
  const { tournament, isFallback, configurationMissing } = await getFeaturedTournament();
  if (configurationMissing) return <main className="min-h-screen bg-[#080b10] text-white"><SiteHeader /><SetupRequired /><SiteFooter /></main>;
  if (!tournament) return <main className="min-h-screen bg-[#080b10] text-white"><SiteHeader /><section className="mx-auto max-w-3xl px-5 py-20 sm:px-8"><p className="text-[10px] font-black uppercase tracking-[.26em] text-[#d8b968]">Tournament service</p><h1 className="mt-3 text-3xl font-black">暂时没有已发布赛事</h1><p className="mt-4 text-sm leading-6 text-slate-400">主办方创建并开放报名后，赛事会显示在这里。</p></section><SiteFooter /></main>;
  const registrationPhase = getTournamentRegistrationPhase(tournament);
  const registrationOpen = registrationPhase === 'OPEN';

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b10] text-white">
      <SiteHeader />

      <section className="relative isolate min-h-[580px] overflow-hidden border-b border-white/10 sm:min-h-[700px]">
        <div className="absolute inset-0 -z-30 bg-[url('/hero-arena.png')] bg-cover bg-center" role="img" aria-label="蓝金两方选手在大型电竞场馆对阵" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(3,7,12,.38)_0%,rgba(3,7,12,.25)_44%,rgba(8,11,16,.96)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,7,12,.18)_55%,rgba(3,7,12,.58)_100%)]" />

        <div className="mx-auto flex min-h-[580px] max-w-7xl flex-col justify-between px-5 pb-6 pt-20 sm:min-h-[700px] sm:px-8 sm:pb-8 sm:pt-24 lg:px-10 lg:pt-28">
          <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center pb-14 text-center">
            <div className="mb-7 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#e6ca7b] sm:text-xs"><span className="h-px w-8 bg-[#d8b968] sm:w-12" />Rift Command · Community Tournament<span className="h-px w-8 bg-[#d8b968] sm:w-12" /></div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200 sm:text-sm">{registrationOpen ? 'Registration now open' : 'Current tournament'}</p>
            <h1 className="max-w-5xl [overflow-wrap:anywhere] text-5xl font-black uppercase leading-[.92] tracking-[-0.06em] text-white drop-shadow-[0_8px_35px_rgba(0,0,0,.9)] sm:text-7xl lg:text-[5.8rem]">{tournament.name}</h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-slate-300 drop-shadow-lg sm:text-lg">{tournament.description}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link href={registrationOpen ? `/tournaments/${tournament.slug}/register` : `/tournaments/${tournament.slug}`} className="gold-button inline-flex min-h-12 items-center justify-center px-8 text-sm font-black uppercase tracking-[0.16em] text-[#080b10]">{registrationOpen ? '立即报名' : '查看赛事'} <span aria-hidden="true" className="ml-3">→</span></Link>
              <Link href={`/tournaments/${tournament.slug}`} className="inline-flex min-h-12 items-center justify-center border border-white/30 bg-black/25 px-8 text-sm font-bold tracking-wide text-white backdrop-blur-md transition hover:border-cyan-200/60 hover:bg-black/40">赛事详情</Link>
            </div>
          </div>

          <div className="grid items-center gap-5 border border-white/12 bg-[#080b10]/78 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:grid-cols-[1.2fr_1fr_1fr] sm:px-7">
            <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Registration</p><p className="mt-1 font-black text-white">{tournamentRegistrationPhaseLabels[registrationPhase]}</p></div>
            <div className="border-y border-white/10 py-3 sm:border-x sm:border-y-0 sm:px-8 sm:py-0"><p className="text-[10px] uppercase tracking-[.2em] text-slate-600">当前申请</p><p className="mt-1 text-sm font-bold text-slate-200"><span className="text-emerald-200">{tournament.approvedCount} 已通过</span> · {tournament.pendingCount} 待审核</p></div>
            <div className="sm:text-right"><p className="text-[10px] uppercase tracking-[.2em] text-slate-600">报名截止</p><p className="mt-1 text-sm font-bold text-white">{formatDateTime(tournament.registrationEndAt, tournament.timezone)}</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        {isFallback ? <p className="mb-7 border border-amber-300/20 bg-amber-300/6 px-5 py-4 text-sm text-amber-100">当前赛事为开发示例，不代表实时报名数据。连接 Supabase 后会自动显示主办方发布的真实赛事。</p> : null}
        <SectionHeading eyebrow="Tournament announcement" title="本期赛事公告" action="全部赛事" href="/tournaments" />
        <div className="mt-8"><TournamentCard tournament={tournament} featured /></div>
      </section>

      <section id="player-ecosystem" className="border-t border-white/8 bg-[#0a0e14]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Player registration</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-.04em] text-white sm:text-4xl">微信群赛事报名流程</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">以赛事报名和主办方审核为中心，不要求绑定国际账号，也不需要先创建完整档案。</p></div><Link href="/tournaments" className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b968]">选择赛事 →</Link></div><div className="mt-8 grid gap-4 md:grid-cols-3"><FlowStep code="01" title="打开群内链接" description="登录后直接进入主办方分享的赛事报名页。" /><FlowStep code="02" title="填写游戏 ID" description="输入玩家名字#编号、段位、位置和群昵称。" /><FlowStep code="03" title="等待主办方审核" description="在账户页查看等待、通过、候补或拒绝状态。" /></div></div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SectionHeading({ eyebrow, title, action, href }: { eyebrow: string; title: string; action?: string; href?: string }) { return <div className="flex items-end justify-between gap-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d8b968]">{eyebrow}</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.035em] text-white sm:text-4xl">{title}</h2></div>{action && href ? <Link className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition hover:text-[#d8b968]" href={href}>{action} →</Link> : null}</div>; }
function FlowStep({ code, title, description }: { code: string; title: string; description: string }) { return <article className="border border-white/9 bg-[#0d1219] p-6"><span className="text-[10px] font-black tracking-[.2em] text-[#d8b968]">{code}</span><h3 className="mt-5 text-xl font-black text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{description}</p></article>; }
