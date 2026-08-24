'use client';

import { FormEvent, useState } from 'react';
import type { PlayerProfile, PlayerRole } from '@/types';

const roles: PlayerRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const servers = ['JP1', 'KR', 'TW2', 'SG2', 'NA1', 'EUW1'];

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
    else setMessage('选手档案已保存。');
    setSubmitting(false);
  }

  const fieldClass = 'mt-2 w-full border border-white/12 bg-[#080b10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b968]/60';

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="block"><span className="text-xs font-bold text-slate-300">显示名称</span><input className={fieldClass} name="display_name" required minLength={2} maxLength={32} defaultValue={profile?.displayName ?? ''} /></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">Riot ID</span><input className={fieldClass} name="riot_id" required pattern="^.{1,16}#[A-Za-z0-9]{2,5}$" placeholder="PlayerName#JP1" defaultValue={profile?.riotId ?? ''} /></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">服务器</span><select className={fieldClass} name="server" defaultValue={profile?.server ?? 'JP1'}>{servers.map((server) => <option key={server}>{server}</option>)}</select></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">当前段位</span><input className={fieldClass} name="rank" required maxLength={40} placeholder="钻石 IV" defaultValue={profile?.rank ?? ''} /></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">主位置</span><select className={fieldClass} name="primary_role" defaultValue={profile?.primaryRole ?? 'MID'}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
      <label className="block"><span className="text-xs font-bold text-slate-300">副位置</span><select className={fieldClass} name="secondary_role" defaultValue={profile?.secondaryRole ?? ''}><option value="">无</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
      <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-300">群昵称</span><input className={fieldClass} name="group_nickname" maxLength={50} defaultValue={profile?.groupNickname ?? ''} /></label>
      <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-300">个人简介</span><textarea className={`${fieldClass} min-h-28 resize-y`} name="bio" maxLength={500} defaultValue={profile?.bio ?? ''} /></label>
      <div className="sm:col-span-2">
        {error ? <p role="alert" className="mb-4 border border-red-300/20 bg-red-300/7 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mb-4 border border-emerald-300/20 bg-emerald-300/7 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
        <button disabled={submitting} className="gold-button min-h-12 px-7 text-sm font-black tracking-[.1em] text-[#080b10] disabled:opacity-60">{submitting ? '保存中…' : profile ? '更新选手档案' : '创建选手档案'}</button>
      </div>
    </form>
  );
}
