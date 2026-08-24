import type { Metadata } from 'next';
import { PageIntro } from '@/components/layout/page-intro';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { TeamCard } from '@/components/team/team-card';
import { teams } from '@/lib/sample-data';

export const metadata: Metadata = { title: '战队档案' };

export default function TeamsPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <PageIntro eyebrow="Team directory" title="参赛战队" description="集中展示参赛队伍、阵容人数和当前战绩。战队资料与选手管理将在接入数据库后开放编辑。" />
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="mb-8 flex items-center justify-between border-b border-white/8 pb-5">
          <p className="text-sm text-slate-500">共 <span className="font-black text-white">{teams.length}</span> 支示例战队</p>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Updated today</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team, index) => <TeamCard key={team.id} team={team} index={index} />)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
