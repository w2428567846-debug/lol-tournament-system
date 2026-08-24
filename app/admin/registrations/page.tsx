import type { Metadata } from 'next';
import { RegistrationReviewList } from '@/components/admin/registration-review-list';
import { getAdminRegistrations, getAdminTournaments } from '@/lib/admin/queries';
import type { RegistrationStatus } from '@/types';

export const metadata: Metadata = { title: '报名审核' };

const statuses: RegistrationStatus[] = ['PENDING', 'APPROVED', 'WAITLISTED', 'REJECTED', 'CANCELLED'];

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const tournamentId = typeof params.tournament === 'string' ? params.tournament : '';
  const statusValue = typeof params.status === 'string' && statuses.includes(params.status as RegistrationStatus) ? params.status as RegistrationStatus : undefined;
  const search = typeof params.search === 'string' ? params.search : '';
  const [registrations, tournaments] = await Promise.all([getAdminRegistrations({ tournamentId: tournamentId || undefined, status: statusValue, search }), getAdminTournaments()]);

  const fieldClass = 'border border-white/10 bg-[#0d1219] px-4 py-3 text-xs text-slate-200 outline-none focus:border-[#d8b968]/50';
  return (
    <main className="px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Registration review</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">报名审核</h1><p className="mt-3 text-sm text-slate-500">筛选、检索并更新玩家的赛事报名状态。</p>
      <form className="mt-8 grid gap-3 border border-white/8 bg-[#0a0e14] p-4 md:grid-cols-[1fr_1fr_1.2fr_auto]" method="get">
        <select className={fieldClass} name="tournament" defaultValue={tournamentId}><option value="">全部赛事</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select>
        <select className={fieldClass} name="status" defaultValue={statusValue ?? ''}><option value="">全部状态</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        <input className={fieldClass} name="search" defaultValue={search} placeholder="搜索游戏 ID / 群昵称" />
        <button className="bg-[#d8b968] px-5 py-3 text-xs font-black text-[#080b10]">筛选</button>
      </form>
      <RegistrationReviewList registrations={registrations} />
    </main>
  );
}
