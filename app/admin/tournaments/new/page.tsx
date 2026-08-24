import type { Metadata } from 'next';
import Link from 'next/link';
import { TournamentForm } from '@/components/admin/tournament-form';

export const metadata: Metadata = { title: '创建赛事' };

export default function NewTournamentPage() {
  return <main className="px-5 py-8 sm:px-8 sm:py-10"><Link href="/admin/tournaments" className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">← 返回赛事管理</Link><p className="mt-7 text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Create tournament</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">创建社区赛事</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">设置报名周期、正式通过名额与分享方式。赛程和分组将在后续阶段处理。</p><TournamentForm /></main>;
}
