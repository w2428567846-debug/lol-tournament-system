import type { Team } from '@/types';

export function TeamCard({ team, index }: { team: Team; index: number }) {
  return (
    <article className="group relative overflow-hidden border border-white/9 bg-[#0d1219] p-6 transition hover:-translate-y-1 hover:border-[#d8b968]/35">
      <span className="absolute right-4 top-2 text-6xl font-black tracking-[-0.08em] text-white/[0.025]">{String(index + 1).padStart(2, '0')}</span>
      <div className="relative flex items-start justify-between">
        <div className="grid h-16 w-16 place-items-center border border-white/12 bg-white/4 text-lg font-black text-slate-200">{team.shortName}</div>
        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${team.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-cyan-400/10 text-cyan-300'}`}>
          {team.status === 'ACTIVE' ? '参赛中' : '招募中'}
        </span>
      </div>
      <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8b968]">{team.region} Region</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{team.name}</h2>
      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{team.description}</p>
      <dl className="mt-7 grid grid-cols-2 border-t border-white/8 pt-5">
        <div><dt className="text-[9px] uppercase tracking-[0.16em] text-slate-600">阵容人数</dt><dd className="mt-1 font-black text-slate-200">{team.players} Players</dd></div>
        <div className="border-l border-white/8 pl-5"><dt className="text-[9px] uppercase tracking-[0.16em] text-slate-600">当前战绩</dt><dd className="mt-1 font-black text-slate-200">{team.record}</dd></div>
      </dl>
    </article>
  );
}
