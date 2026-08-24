'use client';

import { FormEvent, useState } from 'react';
import type { PlayerProfile, PlayerRole } from '@/types';

const roles: Array<{ value: PlayerRole; label: string }> = [
  { value: 'TOP', label: '上路' },
  { value: 'JUNGLE', label: '打野' },
  { value: 'MID', label: '中路' },
  { value: 'ADC', label: '下路' },
  { value: 'SUPPORT', label: '辅助' },
];

export function ProfileForm({ profile }: { profile: PlayerProfile | null }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/account/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json() as { message?: string };

    if (!response.ok) setError(result.message ?? '保存失败，请稍后重试。');
    else setMessage('常用报名资料已保存；已有赛事快照不会改变。');
    setSubmitting(false);
  }

  const fieldClass = 'mt-2 w-full border border-white/12 bg-[#080b10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b968]/60';

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-300">游戏 ID</span><input className={fieldClass} name="game_id" required maxLength={49} placeholder="玩家名字#12345" defaultValue={profile?.gameId ?? ''} /></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">当前段位</span><input className={fieldClass} name="current_rank" required maxLength={40} placeholder="例如：翡翠 II" defaultValue={profile?.currentRank ?? ''} /></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">群昵称</span><input className={fieldClass} name="group_nickname" maxLength={50} defaultValue={profile?.groupNickname ?? ''} /></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">首选位置</span><select className={fieldClass} name="primary_role" defaultValue={profile?.primaryRole ?? 'MID'}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">第二位置</span><select className={fieldClass} name="secondary_role" defaultValue={profile?.secondaryRole ?? ''}><option value="">无</option>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
      <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-300">个人简介</span><textarea className={`${fieldClass} min-h-24 resize-y`} name="bio" maxLength={500} defaultValue={profile?.bio ?? ''} /></label>
      <div className="sm:col-span-2">
        {error ? <p role="alert" className="mb-4 border border-red-300/20 bg-red-300/7 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mb-4 border border-emerald-300/20 bg-emerald-300/7 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
        <button disabled={submitting} className="gold-button min-h-12 w-full px-7 text-sm font-black tracking-[.1em] text-[#080b10] disabled:cursor-wait disabled:opacity-60 sm:w-auto">{submitting ? '保存中…' : profile ? '更新常用资料' : '保存常用资料'}</button>
      </div>
    </form>
  );
}
