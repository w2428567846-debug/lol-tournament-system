'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlayerProfile, PlayerRole, TournamentDetail } from '@/types';

const roles: PlayerRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

export function TournamentRegistrationForm({ tournament, profile }: { tournament: TournamentDetail; profile: PlayerProfile }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fieldClass = 'mt-2 w-full border border-white/12 bg-[#080b10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b968]/60';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, tournament_id: tournament.id }),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) {
      setError(result.message ?? '报名失败，请稍后重试。');
      setSubmitting(false);
      return;
    }
    router.replace(`/account?registered=${encodeURIComponent(tournament.slug)}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
      <div className="border border-white/8 bg-white/[.025] p-4 sm:col-span-2">
        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Saved profile</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"><strong className="text-white">{profile.displayName}</strong><span className="text-slate-400">{profile.riotId}</span><span className="text-slate-500">{profile.server} · {profile.rank}</span></div>
      </div>
      <label><span className="text-xs font-bold text-slate-300">首选位置</span><select className={fieldClass} name="preferred_role" defaultValue={profile.primaryRole}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
      <label><span className="text-xs font-bold text-slate-300">第二位置</span><select className={fieldClass} name="secondary_role" defaultValue={profile.secondaryRole ?? ''}><option value="">无</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
      {tournament.visibility === 'PRIVATE' ? <label className="sm:col-span-2"><span className="text-xs font-bold text-slate-300">赛事邀请码</span><input className={fieldClass} name="invite_code" required autoComplete="off" placeholder="输入群内公布的邀请码" /><span className="mt-2 block text-[11px] text-slate-600">邀请码会发送至服务器验证，不会只在浏览器中判断。</span></label> : null}
      <label className="sm:col-span-2"><span className="text-xs font-bold text-slate-300">给主办方的备注</span><textarea className={`${fieldClass} min-h-28 resize-y`} name="note" maxLength={500} placeholder="可填写可参赛时间或其他说明（选填）" /></label>
      {error ? <p role="alert" className="border border-red-300/20 bg-red-300/7 px-4 py-3 text-sm text-red-200 sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2"><button disabled={submitting} className="gold-button min-h-12 px-8 text-sm font-black tracking-[.12em] text-[#080b10] disabled:opacity-60">{submitting ? '提交中…' : '确认提交报名'}</button></div>
    </form>
  );
}
