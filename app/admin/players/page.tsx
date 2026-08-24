import type { Metadata } from 'next';
import { formatDateTime } from '@/lib/format';
import { getAdminPlayers } from '@/lib/admin/queries';

export const metadata: Metadata = { title: '后台选手管理' };

export default async function AdminPlayersPage() {
  const players = await getAdminPlayers();
  return (
    <main className="px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Saved defaults</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">常用玩家资料</h1><p className="mt-3 text-sm text-slate-500">这里是玩家自愿保存的预填资料；赛事审核应以每次报名快照为准。</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{players.map((player) => <article key={player.id} className="border border-white/8 bg-[#0d1219] p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-black text-white">{player.gameId}</h2><p className="mt-1 text-sm text-slate-400">{player.currentRank}</p></div><span className="border border-[#d8b968]/25 px-2 py-1 text-[9px] font-black text-[#d8b968]">{player.primaryRole}</span></div><dl className="mt-5 space-y-2 border-t border-white/8 pt-4 text-xs"><div className="flex justify-between"><dt className="text-slate-600">群昵称</dt><dd className="text-slate-300">{player.groupNickname ?? '—'}</dd></div><div className="flex justify-between"><dt className="text-slate-600">更新时间</dt><dd className="text-slate-500">{formatDateTime(player.updatedAt)}</dd></div></dl></article>)}</div>
      {players.length === 0 ? <p className="mt-8 border border-dashed border-white/12 p-8 text-center text-sm text-slate-600">还没有玩家保存常用资料；这不会阻挡直接报名。</p> : null}
    </main>
  );
}
