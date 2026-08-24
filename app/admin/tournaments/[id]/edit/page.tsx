import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TournamentForm } from '@/components/admin/tournament-form';
import { getAdminTournament } from '@/lib/admin/queries';

export const metadata: Metadata = { title: '编辑赛事' };

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getAdminTournament(id);
  if (!tournament) notFound();
  return <main className="px-5 py-8 sm:px-8 sm:py-10"><Link href="/admin/tournaments" className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">← 返回赛事管理</Link><p className="mt-7 text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Tournament operations</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">编辑 {tournament.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">保存资料、控制报名阶段并复制微信群报名链接。</p><TournamentForm tournament={tournament} /></main>;
}
