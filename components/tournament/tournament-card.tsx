import Link from 'next/link';
import type { Tournament } from '@/types';

export function TournamentCard({ tournament, featured = false }: { tournament: Tournament; featured?: boolean }) {
  return (
    <article className={`relative overflow-hidden border border-white/10 bg-[#0d1219] ${featured ? 'grid lg:grid-cols-[1.25fr_.75fr]' : ''}`}>
      <div className="relative p-7 sm:p-10">
        <div className="absolute right-0 top-0 h-28 w-28 border-l border-b border-[#d8b968]/12" aria-hidden="true" />
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">正在进行</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{tournament.format}</span>
        </div>
        <h3 className="max-w-2xl text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl">{tournament.name}</h3>
        <p className="mt-4 max-w-2xl leading-7 text-slate-400">{tournament.description}</p>
        <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4 text-sm">
          <Stat label="赛期" value={`${tournament.startDate} — ${tournament.endDate}`} />
          <Stat label="战队" value={`${tournament.teamCount} / ${tournament.maxTeams}`} />
          <Stat label="默认赛制" value={`BO${tournament.defaultBestOf}`} />
        </div>
        <Link href="/tournaments" className="mt-9 inline-flex items-center text-xs font-black uppercase tracking-[0.16em] text-[#d8b968]">
          进入赛事中心 <span className="ml-3">→</span>
        </Link>
      </div>
      {featured ? (
        <div className="flex min-h-64 flex-col justify-between border-t border-white/8 bg-[#0a0f16] p-7 lg:border-l lg:border-t-0 sm:p-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">Tournament progress</p>
            <p className="mt-3 text-2xl font-black text-white">小组赛 · 第 3 日</p>
          </div>
          <div className="space-y-4">
            <div className="h-1.5 overflow-hidden bg-white/8"><div className="h-full w-[46%] bg-[#d8b968]" /></div>
            <div className="flex justify-between text-xs text-slate-500"><span>已完成 15 场</span><span>46%</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {['小组赛', '淘汰赛', '总决赛'].map((stage, index) => <span key={stage} className={`border px-2 py-3 text-[10px] font-bold ${index === 0 ? 'border-[#d8b968]/30 text-[#d8b968]' : 'border-white/8 text-slate-600'}`}>{stage}</span>)}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">{label}</p><p className="mt-1 font-bold text-slate-200">{value}</p></div>;
}
