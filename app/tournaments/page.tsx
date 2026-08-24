import type { Metadata } from 'next';
import { PageIntro } from '@/components/layout/page-intro';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { tournaments } from '@/lib/sample-data';

export const metadata: Metadata = { title: '赛事中心' };

export default function TournamentsPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <PageIntro eyebrow="Tournament center" title="赛事中心" description="查看正在进行、即将开始和已经结束的赛事。后续阶段将接入报名、分组、赛程和淘汰赛完整数据。" />
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
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
