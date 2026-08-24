import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { MatchCard } from '@/components/match/match-card';
import { TournamentCard } from '@/components/tournament/tournament-card';
import {
  featuredTournament,
  players,
  recentResults,
  standings,
  upcomingMatches,
} from '@/lib/sample-data';

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b10] text-white">
      <SiteHeader />

      <section className="relative isolate min-h-[700px] overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 -z-30 bg-[url('/hero-arena.png')] bg-cover bg-center"
          role="img"
          aria-label="蓝金两方选手在大型电竞场馆对阵"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(3,7,12,.38)_0%,rgba(3,7,12,.25)_44%,rgba(8,11,16,.96)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,7,12,.18)_55%,rgba(3,7,12,.58)_100%)]" />

        <div className="mx-auto flex min-h-[700px] max-w-7xl flex-col justify-between px-5 pb-8 pt-24 sm:px-8 lg:px-10 lg:pt-28">
          <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center pb-14 text-center">
            <div className="mb-7 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#e6ca7b] sm:text-xs">
              <span className="h-px w-8 bg-[#d8b968] sm:w-12" />
              Rift Command · 2026
              <span className="h-px w-8 bg-[#d8b968] sm:w-12" />
            </div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200 sm:text-sm">
              Summer Championship
            </p>
            <h1 className="text-5xl font-black uppercase leading-[.92] tracking-[-0.06em] text-white drop-shadow-[0_8px_35px_rgba(0,0,0,.9)] sm:text-7xl lg:text-[6.5rem]">
              掌控每一场
              <span className="mt-2 block bg-gradient-to-r from-[#f4dc91] via-[#d8b968] to-[#f2b35d] bg-clip-text text-transparent">荣耀之战</span>
            </h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-slate-300 drop-shadow-lg sm:text-lg">
              从报名到捧杯，一站式管理战队、选手、赛程与积分。让每一场对决，都值得被看见。
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/players#register"
                className="gold-button inline-flex min-h-12 items-center justify-center px-8 text-sm font-black uppercase tracking-[0.16em] text-[#080b10]"
              >
                立即报名 <span aria-hidden="true" className="ml-3">→</span>
              </Link>
              <Link
                href="#matches"
                className="inline-flex min-h-12 items-center justify-center border border-white/30 bg-black/25 px-8 text-sm font-bold tracking-wide text-white backdrop-blur-md transition hover:border-cyan-200/60 hover:bg-black/40"
              >
                查看赛程
              </Link>
            </div>
          </div>

          <div className="grid items-center gap-5 border border-white/12 bg-[#080b10]/78 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:grid-cols-[1fr_auto_1fr] sm:px-7">
            <div className="flex items-center justify-center gap-4 sm:justify-start">
              <span className="grid h-12 w-12 place-items-center border border-cyan-300/35 bg-cyan-300/10 font-black text-cyan-100">T1</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-300">Blue side</p>
                <p className="mt-1 font-black text-white">T1</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 border-y border-white/10 py-3 sm:border-x sm:border-y-0 sm:px-8 sm:py-0">
              <span className="live-pill whitespace-nowrap">今日 20:00</span>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[.24em] text-slate-500">Group stage · BO3</p>
                <p className="mt-1 text-lg font-black italic text-white">VS</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 sm:justify-end">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Red side</p>
                <p className="mt-1 font-black text-white">Gen.G</p>
              </div>
              <span className="grid h-12 w-12 place-items-center border border-[#d8b968]/40 bg-[#d8b968]/10 font-black text-[#f1d989]">GEN</span>
            </div>
          </div>
        </div>
      </section>

      <section id="player-stats" className="border-b border-white/8 bg-[#0a0e14]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Player ecosystem</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-.04em] text-white sm:text-4xl">选手数据中心</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">报名池、位置分布与赛事评分集中呈现，让组队和招募更高效。</p>
            </div>
            <Link href="/players" className="text-xs font-bold uppercase tracking-[.16em] text-slate-400 transition hover:text-[#d8b968]">进入选手中心 →</Link>
          </div>

          <div className="mt-9 grid gap-4 lg:grid-cols-[.88fr_1.12fr]">
            <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/9 bg-white/9">
              {[
                ['156', '注册选手', '+12 本周'],
                ['24', '自由选手', '开放招募'],
                ['38', '活跃战队', '6 支招募中'],
                ['9.8', '最高评分', '13 场赛事'],
              ].map(([value, label, note]) => (
                <div key={label} className="bg-[#0d1219] p-5 sm:p-7">
                  <p className="text-3xl font-black tracking-tight text-white sm:text-4xl">{value}</p>
                  <p className="mt-2 text-xs font-bold text-slate-300">{label}</p>
                  <p className="mt-3 text-[9px] uppercase tracking-[.18em] text-[#d8b968]">{note}</p>
                </div>
              ))}
            </div>

            <div className="border border-white/9 bg-[#0d1219]">
              <div className="grid grid-cols-[44px_1fr_76px_60px] border-b border-white/8 px-4 py-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-600 sm:px-6">
                <span>#</span><span>选手</span><span>位置</span><span className="text-right">评分</span>
              </div>
              {players.slice(0, 4).map((player, index) => (
                <div key={player.id} className="grid grid-cols-[44px_1fr_76px_60px] items-center border-b border-white/6 px-4 py-4 last:border-0 sm:px-6">
                  <span className={`text-sm font-black ${index === 0 ? 'text-[#d8b968]' : 'text-slate-600'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-black text-white">{player.summonerName}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{player.team?.shortName ?? 'FREE'}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">{player.role}</span>
                  <span className="text-right text-lg font-black text-white">{player.rating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <SectionHeading eyebrow="Spotlight" title="当前赛事" action="全部赛事" href="/tournaments" />
        <div className="mt-8">
          <TournamentCard tournament={featuredTournament} featured />
        </div>
      </section>

      <section id="matches" className="border-y border-white/8 bg-[#0a0e14]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
          <SectionHeading eyebrow="Match center" title="即将开始" />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {upcomingMatches.map((match) => <MatchCard key={match.id} match={match} />)}
          </div>
        </div>
      </section>

      <section id="standings" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
        <div>
          <SectionHeading eyebrow="Latest scores" title="最近结果" />
          <div className="mt-8 space-y-3">
            {recentResults.map((match) => <MatchCard key={match.id} match={match} compact />)}
          </div>
        </div>

        <div>
          <SectionHeading eyebrow="Group A" title="当前积分" />
          <div className="mt-8 overflow-hidden border border-white/10 bg-[#0d1219]">
            <div className="grid grid-cols-[44px_1fr_repeat(3,54px)] border-b border-white/8 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 sm:px-6">
              <span>#</span><span>战队</span><span className="text-center">胜</span><span className="text-center">负</span><span className="text-right">积分</span>
            </div>
            {standings.map((team, index) => (
              <div key={team.shortName} className="grid grid-cols-[44px_1fr_repeat(3,54px)] items-center border-b border-white/6 px-4 py-4 last:border-0 sm:px-6">
                <span className={`text-sm font-black ${index < 2 ? 'text-[#d8b968]' : 'text-slate-600'}`}>{String(index + 1).padStart(2, '0')}</span>
                <span className="font-bold text-slate-100">{team.name} <span className="ml-2 text-xs text-slate-600">{team.shortName}</span></span>
                <span className="text-center font-semibold text-slate-300">{team.wins}</span>
                <span className="text-center text-slate-500">{team.losses}</span>
                <span className="text-right text-lg font-black text-white">{team.points}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 text-center text-xs uppercase tracking-[0.18em] text-slate-600">
        Rift Command · Tournament Management System
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, action, href }: { eyebrow: string; title: string; action?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d8b968]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.035em] text-white sm:text-4xl">{title}</h2>
      </div>
      {action && href ? <Link className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition hover:text-[#d8b968]" href={href}>{action} →</Link> : null}
    </div>
  );
}
