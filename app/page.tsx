import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { MatchCard } from '@/components/match/match-card';
import { TournamentCard } from '@/components/tournament/tournament-card';
import {
  featuredTournament,
  recentResults,
  standings,
  upcomingMatches,
} from '@/lib/sample-data';

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b10] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/8">
        <div className="hero-grid absolute inset-0 -z-10 opacity-40" />
        <div className="absolute -left-40 top-12 -z-10 h-96 w-96 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#d8b968]">
              <span className="h-px w-10 bg-[#d8b968]" />
              Tournament operations platform
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Summer Championship 2026
            </p>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">
              掌控每一场
              <span className="block text-[#d8b968]">荣耀之战</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              从战队报名、赛程编排到比分结算与自动晋级，让每一场英雄联盟赛事都清晰、专业、有序。
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/tournaments"
                className="gold-button inline-flex min-h-12 items-center justify-center px-7 text-sm font-black uppercase tracking-[0.16em] text-[#080b10]"
              >
                查看当前赛事 <span aria-hidden="true" className="ml-3">→</span>
              </Link>
              <Link
                href="#matches"
                className="inline-flex min-h-12 items-center justify-center border border-white/15 px-7 text-sm font-bold tracking-wide text-slate-200 transition hover:border-cyan-300/50 hover:text-white"
              >
                今日赛程
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 border-y border-white/10 py-5">
              {[
                ['16', '参赛战队'],
                ['32', '总比赛数'],
                ['08', '比赛日'],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-white/10 px-4 first:pl-0 last:border-0">
                  <dt className="text-2xl font-black tracking-tight text-white">{value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:ml-auto">
            <div className="absolute -inset-3 border border-[#d8b968]/15" />
            <div className="relative overflow-hidden border border-white/10 bg-[#0d1219]/95 p-6 shadow-2xl shadow-black/50 sm:p-8">
              <div className="mb-8 flex items-center justify-between border-b border-white/8 pb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d8b968]">Featured match</p>
                  <p className="mt-2 text-sm font-semibold text-slate-200">小组赛 · 第 3 轮</p>
                </div>
                <span className="live-pill">今日 20:00</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                <TeamMark shortName="T1" tone="gold" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-600">Best of 3</div>
                  <div className="my-3 text-2xl font-black italic text-slate-400">VS</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Match 014</div>
                </div>
                <TeamMark shortName="GEN" tone="cyan" />
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/8 pt-5 text-xs text-slate-500">
                <span>线上赛 · 召唤峡谷</span>
                <span className="text-slate-300">赛前分析 →</span>
              </div>
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

function TeamMark({ shortName, tone }: { shortName: string; tone: 'gold' | 'cyan' }) {
  const toneClasses = tone === 'gold'
    ? 'border-[#d8b968]/40 bg-[#d8b968]/10 text-[#f1d989]'
    : 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';

  return (
    <div>
      <div className={`mx-auto grid h-24 w-24 place-items-center border text-2xl font-black tracking-tight ${toneClasses}`}>
        {shortName}
      </div>
      <p className="mt-4 text-lg font-black text-white">{shortName}</p>
    </div>
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
