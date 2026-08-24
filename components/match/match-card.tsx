import type { Match } from '@/types';

export function MatchCard({ match, compact = false }: { match: Match; compact?: boolean }) {
  const finished = match.status === 'FINISHED';

  return (
    <article className={`group border border-white/9 bg-[#0d1219] transition hover:border-[#d8b968]/30 ${compact ? 'px-5 py-4' : 'p-5 sm:p-6'}`}>
      <div className="mb-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
        <span>{match.stage}</span>
        <span className={finished ? 'text-slate-500' : match.status === 'LIVE' ? 'text-rose-400' : 'text-cyan-300'}>
          {finished ? '已结束' : match.status === 'LIVE' ? '● 直播中' : match.time}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Team team={match.teamA} align="right" />
        <div className="min-w-20 text-center">
          {finished ? (
            <p className="text-2xl font-black tracking-tight text-white">{match.scoreA} <span className="mx-1 text-slate-700">:</span> {match.scoreB}</p>
          ) : (
            <p className="text-xl font-black italic text-slate-600">VS</p>
          )}
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">BO{match.bestOf}</p>
        </div>
        <Team team={match.teamB} align="left" />
      </div>
      {!compact ? <div className="mt-5 border-t border-white/6 pt-4 text-center text-[10px] uppercase tracking-[0.16em] text-slate-600">{match.date} · {match.venue}</div> : null}
    </article>
  );
}

function Team({ team, align }: { team: Match['teamA']; align: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-3 ${align === 'right' ? 'justify-end text-right' : ''}`}>
      {align === 'left' ? <span className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-white/4 text-xs font-black text-slate-300">{team.shortName}</span> : null}
      <div>
        <p className="font-black text-slate-100">{team.shortName}</p>
        <p className="hidden text-[10px] text-slate-600 sm:block">{team.name}</p>
      </div>
      {align === 'right' ? <span className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-white/4 text-xs font-black text-slate-300">{team.shortName}</span> : null}
    </div>
  );
}
