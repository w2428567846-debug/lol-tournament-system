import type { Player } from '@/types';

const roleLabels = {
  TOP: '上路',
  JUNGLE: '打野',
  MID: '中路',
  ADC: '下路',
  SUPPORT: '辅助',
};

const roleTones = {
  TOP: 'border-orange-300/30 bg-orange-300/8 text-orange-200',
  JUNGLE: 'border-emerald-300/30 bg-emerald-300/8 text-emerald-200',
  MID: 'border-violet-300/30 bg-violet-300/8 text-violet-200',
  ADC: 'border-cyan-300/30 bg-cyan-300/8 text-cyan-200',
  SUPPORT: 'border-[#d8b968]/35 bg-[#d8b968]/8 text-[#f1d989]',
};

export function PlayerCard({ player, index }: { player: Player; index: number }) {
  return (
    <article className="group relative overflow-hidden border border-white/9 bg-[#0d1219] p-6 transition hover:-translate-y-1 hover:border-[#d8b968]/35">
      <span className="absolute -right-1 -top-5 text-8xl font-black tracking-[-0.08em] text-white/[0.025]">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="relative flex items-start justify-between gap-5">
        <div className="grid h-14 w-14 place-items-center border border-white/12 bg-white/4 text-xl font-black text-white">
          {player.summonerName.slice(0, 1)}
        </div>
        <span className={`border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${roleTones[player.role]}`}>
          {roleLabels[player.role]} · {player.role}
        </span>
      </div>

      <div className="relative mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">{player.realName}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">{player.summonerName}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-400">{player.team?.name ?? '自由选手'}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">Rating</p>
          <p className="mt-1 text-3xl font-black text-[#d8b968]">{player.rating.toFixed(1)}</p>
        </div>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 border-t border-white/8 pt-5">
        <div>
          <dt className="text-[9px] uppercase tracking-[0.16em] text-slate-600">当前段位</dt>
          <dd className="mt-1 text-sm font-bold text-slate-200">{player.rank}</dd>
        </div>
        <div className="border-l border-white/8 pl-5">
          <dt className="text-[9px] uppercase tracking-[0.16em] text-slate-600">赛事场次</dt>
          <dd className="mt-1 text-sm font-bold text-slate-200">{player.matches} Matches</dd>
        </div>
      </dl>
    </article>
  );
}
