import type { Metadata } from 'next';
import { PageIntro } from '@/components/layout/page-intro';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { listTournaments } from '@/lib/tournaments/queries';

export const metadata: Metadata = { title: '赛事中心' };

export default async function TournamentsPage() {
  const { tournaments, isFallback } = await listTournaments();
  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <PageIntro eyebrow="Tournament center" title="赛事中心" description="查看开放报名、正在进行和已经结束的社区赛事。私人赛事可通过主办方分享的专属链接进入。" />
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        {isFallback ? <p className="mb-7 border border-amber-300/20 bg-amber-300/6 px-5 py-4 text-sm text-amber-100">当前展示开发示例；连接 Supabase 后将自动切换为真实赛事数据。</p> : null}
        <div className="mb-8 flex flex-wrap gap-2">
          {['全部赛事', '正在进行', '报名中', '已结束'].map((filter, index) => (
            <span key={filter} className={`border px-4 py-2 text-xs font-bold ${index === 0 ? 'border-[#d8b968]/45 bg-[#d8b968]/8 text-[#d8b968]' : 'border-white/10 text-slate-500'}`}>{filter}</span>
          ))}
        </div>
        <div className="space-y-5">
          {tournaments.map((tournament, index) => <TournamentCard key={tournament.id} tournament={tournament} featured={index === 0} />)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
