import type { Metadata } from 'next';
import { PlayerPerformanceEditor } from '@/components/admin/player-performance-editor';
import { StatusBadge } from '@/components/registration/status-badge';
import { getAdminRegistrations } from '@/lib/admin/queries';
import { playerRoleLabels } from '@/lib/registrations/labels';

export const metadata: Metadata = { title: '选手费用与赛事数据' };

export default async function AdminPlayersPage() {
  const registrations = await getAdminRegistrations({ status: 'APPROVED' });
  return (
    <main className="px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Player valuation & performance</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">选手费用与赛事数据</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">为每届赛事的已通过选手设置虚拟费用、所属战队和比赛结果。费用只表示竞技水平；同一选手不同赛事的数据独立保存。</p>
      <div className="mt-8 space-y-4">
        {registrations.map((registration) => (
          <article key={registration.id} className="border border-white/8 bg-[#0d1219] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-black">{registration.gameId}</h2><StatusBadge status={registration.status} /></div><p className="mt-2 text-sm text-slate-400">{registration.rankSnapshot} · {playerRoleLabels[registration.primaryRole]}{registration.secondaryRole ? ` / ${playerRoleLabels[registration.secondaryRole]}` : ''}</p><p className="mt-1 text-xs text-slate-600">群昵称：{registration.groupNicknameSnapshot ?? '—'}</p></div>
              <div className="sm:text-right"><p className="text-sm font-black text-slate-200">{registration.tournament.name}</p><p className="mt-1 text-xs text-slate-600">{registration.teamName ?? '尚未分队'} · {registration.valuation == null ? '费用待定' : `${registration.valuation.toFixed(1)} 费`}</p></div>
            </div>
            <PlayerPerformanceEditor registration={registration} />
          </article>
        ))}
      </div>
      {registrations.length === 0 ? <p className="mt-8 border border-dashed border-white/12 p-8 text-center text-sm text-slate-600">还没有已通过的报名。请先在“报名审核”中通过选手。</p> : null}
    </main>
  );
}
