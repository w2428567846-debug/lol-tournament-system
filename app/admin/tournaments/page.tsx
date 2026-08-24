import type { Metadata } from 'next';
import Link from '@/components/navigation/safe-link';
import { RegistrationShareActions } from '@/components/tournament/registration-share-actions';
import { formatDateTime } from '@/lib/format';
import { getAdminTournaments } from '@/lib/admin/queries';
import { tournamentStatusDescriptions, tournamentStatusLabels } from '@/lib/tournaments/status';
import { tournamentVisibilityLabels } from '@/lib/tournaments/labels';

export const metadata: Metadata = { title: '后台赛事管理' };

export default async function AdminTournamentsPage() {
  const tournaments = await getAdminTournaments();
  return (
    <main className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><AdminHeading eyebrow="Tournament management" title="赛事管理" description="创建赛事、控制报名阶段、锁定名单并分享微信群报名链接。" /><Link href="/admin/tournaments/new" className="bg-[#d8b968] px-5 py-3 text-xs font-black text-[#080b10]">＋ 创建赛事</Link></div>
      <div className="mt-8 overflow-x-auto border border-white/8 bg-[#0d1219]">
        <table className="min-w-[980px] w-full text-left"><thead className="border-b border-white/8 text-[9px] uppercase tracking-[.18em] text-slate-600"><tr><th className="px-5 py-4">赛事</th><th className="px-5 py-4">状态</th><th className="px-5 py-4">可见性</th><th className="px-5 py-4">报名截止</th><th className="px-5 py-4">分享</th><th className="px-5 py-4">操作</th></tr></thead><tbody>{tournaments.map((tournament) => <tr key={tournament.id} className="border-b border-white/6 last:border-0"><td className="px-5 py-4"><p className="font-bold text-white">{tournament.name}</p><p className="mt-1 text-xs text-slate-600">/{tournament.slug}</p></td><td className="px-5 py-4"><p className="text-xs font-bold text-emerald-200">{tournamentStatusLabels[tournament.status]}</p><p className="mt-1 max-w-48 text-[10px] leading-4 text-slate-600">{tournamentStatusDescriptions[tournament.status]}</p></td><td className="px-5 py-4 text-xs text-slate-400">{tournamentVisibilityLabels[tournament.visibility]}</td><td className="px-5 py-4 text-xs text-slate-400">{formatDateTime(tournament.registrationEndAt, tournament.timezone)}</td><td className="px-5 py-4"><RegistrationShareActions slug={tournament.slug} /></td><td className="px-5 py-4"><div className="flex gap-3"><Link href={`/admin/tournaments/${tournament.id}/edit`} className="text-xs font-bold text-[#d8b968]">编辑</Link><Link href={`/tournaments/${tournament.slug}`} className="text-xs font-bold text-slate-500">查看</Link></div></td></tr>)}</tbody></table>
        {tournaments.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">数据库中还没有赛事。</p> : null}
      </div>
    </main>
  );
}

function AdminHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>; }
