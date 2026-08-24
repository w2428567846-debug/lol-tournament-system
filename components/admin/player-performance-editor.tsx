'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminRegistration } from '@/types';

export function PlayerPerformanceEditor({ registration }: { registration: AdminRegistration }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputClass = 'mt-2 w-full border border-white/10 bg-[#080b10] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#d8b968]/55';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/admin/registrations/${registration.id}/performance`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) setError(result.message ?? '赛事数据保存失败。');
    else {
      setMessage('已保存；公开赛事的花名册会同步更新。');
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border-t border-white/8 pt-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="虚拟费用（费）"><input className={inputClass} name="valuation" type="number" min="0" max="99.9" step="0.5" placeholder="例如 5.5" defaultValue={registration.valuation ?? ''} /></Field>
        <Field label="本届战队"><input className={inputClass} name="team_name" maxLength={80} placeholder="尚未分队可留空" defaultValue={registration.teamName ?? ''} /></Field>
        <Field label="比赛场数"><input className={inputClass} name="matches_played" type="number" min="0" step="1" required defaultValue={registration.matchesPlayed} /></Field>
        <Field label="最终名次"><input className={inputClass} name="placement" type="number" min="1" step="1" placeholder="未结束可留空" defaultValue={registration.placement ?? ''} /></Field>
        <Field label="胜 / 负"><div className="grid grid-cols-2 gap-2"><input aria-label="胜场" className={inputClass} name="wins" type="number" min="0" step="1" required defaultValue={registration.wins} /><input aria-label="负场" className={inputClass} name="losses" type="number" min="0" step="1" required defaultValue={registration.losses} /></div></Field>
        <Field label="击杀 K"><input className={inputClass} name="kills" type="number" min="0" step="1" required defaultValue={registration.kills} /></Field>
        <Field label="死亡 D"><input className={inputClass} name="deaths" type="number" min="0" step="1" required defaultValue={registration.deaths} /></Field>
        <Field label="助攻 A"><input className={inputClass} name="assists" type="number" min="0" step="1" required defaultValue={registration.assists} /></Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={submitting} className="gold-button min-h-10 px-5 text-xs font-black text-[#080b10] disabled:cursor-wait disabled:opacity-55">{submitting ? '保存中…' : '保存费用与赛事数据'}</button>
        <p className="text-xs text-slate-600">费用仅代表选手水平，不涉及付款或真实货币。</p>
      </div>
      {error ? <p role="alert" className="mt-3 text-xs text-red-200">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-200">{message}</p> : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-bold text-slate-400">{label}</span>{children}</label>;
}
