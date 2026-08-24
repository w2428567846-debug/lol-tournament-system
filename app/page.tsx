import Link from 'next/link';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { MatchCard } from '@/components/match/match-card';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { formatDateTime } from '@/lib/format';
import { recentResults, standings, upcomingMatches } from '@/lib/sample-data';
import { getFeaturedTournament } from '@/lib/tournaments/queries';

export default async function HomePage() {
  const { tournament, isFallback } = await getFeaturedTournament();
  const registrationOpen = tournament.status === 'REGISTRATION';

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b10] text-white">
      <SiteHeader />

      <section className="relative isolate min-h-[700px] overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-30 bg-[url('/hero-arena.png')] bg-cover bg-center" role="img" aria-label="蓝金两方选手在大型电竞场馆对阵" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(3,7,12,.38)_0%,rgba(3,7,12,.25)_44%,rgba(8,11,16,.96)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,7,12,.18)_55%,rgba(3,7,12,.58)_100%)]" />

        <div className="mx-auto flex min-h-[700px] max-w-7xl flex-col justify-between px-5 pb-8 pt-24 sm:px-8 lg:px-10 lg:pt-28">
          <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center pb-14 text-center">
            <div className="mb-7 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#e6ca7b] sm:text-xs"><span className="h-px w-8 bg-[#d8b968] sm:w-12" />Rift Command · Community Tournament<span className="h-px w-8 bg-[#d8b968] sm:w-12" /></div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200 sm:text-sm">{registrationOpen ? 'Registration now open' : 'Current tournament'}</p>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[.92] tracking-[-0.06em] text-white drop-shadow-[0_8px_35px_rgba(0,0,0,.9)] sm:text-7xl lg:text-[5.8rem]">{tournament.name}</h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-slate-300 drop-shadow-lg sm:text-lg">{tournament.description}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link href={registrationOpen ? `/tournaments/${tournament.slug}/register` : `/tournaments/${tournament.slug}`} className="gold-button inline-flex min-h-12 items-center justify-center px-8 text-sm font-black uppercase tracking-[0.16em] text-[#080b10]">{registrationOpen ? '立即报名' : '查看赛事'} <span aria-hidden="true" className="ml-3">→</span></Link>
              <Link href={`/tournaments/${tournament.slug}`} className="inline-flex min-h-12 items-center justify-center border border-white/30 bg-black/25 px-8 text-sm font-bold tracking-wide text-white backdrop-blur-md transition hover:border-cyan-200/60 hover:bg-black/40">赛事详情</Link>
            </div>
          </div>

          <div className="grid items-center gap-5 border border-white/12 bg-[#080b10]/78 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:grid-cols-[1.2fr_1fr_1fr] sm:px-7">
            <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Registration</p><p className="mt-1 font-black text-white">{registrationOpen ? '报名通道开放' : tournament.status}</p></div>
            <div className="border-y border-white/10 py-3 sm:border-x sm:border-y-0 sm:px-8 sm:py-0"><p className="text-[10px] uppercase tracking-[.2em] text-slate-600">当前申请</p><p className="mt-1 text-sm font-bold text-slate-200"><span className="text-emerald-200">{tournament.approvedCount} 已通过</span> · {tournament.pendingCount} 待审核</p></div>
            <div className="sm:text-right"><p className="text-[10px] uppercase tracking-[.2em] text-slate-600">报名截止</p><p className="mt-1 text-sm font-bold text-white">{formatDateTime(tournament.registrationEndAt)}</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        {isFallback ? <p className="mb-7 border border-amber-300/20 bg-amber-300/6 px-5 py-4 text-sm text-amber-100">当前赛事为开发示例，不代表实时报名数据。连接 Supabase 后会自动显示主办方发布的真实赛事。</p> : null}
        <SectionHeading eyebrow="Tournament announcement" title="本期赛事公告" action="全部赛事" href="/tournaments" />
        <div className="mt-8"><TournamentCard tournament={tournament} featured /></div>
      </section>

      <section id="matches" className="border-y border-white/8 bg-[#0a0e14]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10"><SectionHeading eyebrow="Match center" title="即将开始" /><p className="mt-3 text-xs text-slate-600">赛程仍为界面示例，比赛逻辑将在后续阶段接入。</p><div className="mt-8 grid gap-4 lg:grid-cols-2">{upcomingMatches.map((match) => <MatchCard key={match.id} match={match} />)}</div></div>
      </section>

      <section id="standings" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
        <div><SectionHeading eyebrow="Latest scores" title="最近结果" /><p className="mt-3 text-xs text-slate-600">演示内容</p><div className="mt-8 space-y-3">{recentResults.map((match) => <MatchCard key={match.id} match={match} compact />)}</div></div>
        <div><SectionHeading eyebrow="Group A" title="当前积分" /><p className="mt-3 text-xs text-slate-600">演示内容</p><div className="mt-8 overflow-hidden border border-white/10 bg-[#0d1219]"><div className="grid grid-cols-[44px_1fr_repeat(3,54px)] border-b border-white/8 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 sm:px-6"><span>#</span><span>战队</span><span className="text-center">胜</span><span className="text-center">负</span><span className="text-right">积分</span></div>{standings.map((team, index) => <div key={team.shortName} className="grid grid-cols-[44px_1fr_repeat(3,54px)] items-center border-b border-white/6 px-4 py-4 last:border-0 sm:px-6"><span className={`text-sm font-black ${index < 2 ? 'text-[#d8b968]' : 'text-slate-600'}`}>{String(index + 1).padStart(2, '0')}</span><span className="font-bold text-slate-100">{team.name} <span className="ml-2 text-xs text-slate-600">{team.shortName}</span></span><span className="text-center font-semibold text-slate-300">{team.wins}</span><span className="text-center text-slate-500">{team.losses}</span><span className="text-right text-lg font-black text-white">{team.points}</span></div>)}</div></div>
      </section>

      <section id="player-ecosystem" className="border-t border-white/8 bg-[#0a0e14]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Player ecosystem</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-.04em] text-white sm:text-4xl">社区报名流程</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">不展示虚假的职业选手统计。真实人数、位置和参与者只会来自数据库及主办方审核结果。</p></div><Link href="/account" className="text-xs font-bold uppercase tracking-[.16em] text-[#d8b968]">建立我的档案 →</Link></div><div className="mt-8 grid gap-4 md:grid-cols-3"><FlowStep code="01" title="建立选手档案" description="保存 Riot ID、服务器、段位和首选位置。" /><FlowStep code="02" title="提交赛事报名" description="私人赛事由服务器验证群内邀请码。" /><FlowStep code="03" title="等待主办方审核" description="在账户页查看 PENDING、APPROVED 等真实状态。" /></div></div>
      </section>
      <SiteFooter />
    </main>
  );
}

function SectionHeading({ eyebrow, title, action, href }: { eyebrow: string; title: string; action?: string; href?: string }) { return <div className="flex items-end justify-between gap-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d8b968]">{eyebrow}</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.035em] text-white sm:text-4xl">{title}</h2></div>{action && href ? <Link className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition hover:text-[#d8b968]" href={href}>{action} →</Link> : null}</div>; }
function FlowStep({ code, title, description }: { code: string; title: string; description: string }) { return <article className="border border-white/9 bg-[#0d1219] p-6"><span className="text-[10px] font-black tracking-[.2em] text-[#d8b968]">{code}</span><h3 className="mt-5 text-xl font-black text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{description}</p></article>; }
