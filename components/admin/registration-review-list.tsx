'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RegistrationActions } from '@/components/admin/registration-actions';
import { StatusBadge } from '@/components/registration/status-badge';
import { formatDateTime } from '@/lib/format';
import type { AdminRegistration, RegistrationStatus } from '@/types';

const batchActions: Array<{ status: RegistrationStatus; label: string }> = [
  { status: 'APPROVED', label: '批量通过' },
  { status: 'WAITLISTED', label: '批量候补' },
  { status: 'REJECTED', label: '批量拒绝' },
];

export function RegistrationReviewList({ registrations }: { registrations: AdminRegistration[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<RegistrationStatus | null>(null);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function updateBatch(status: RegistrationStatus) {
    if (selected.length === 0) return;
    setSubmitting(status);
    const response = await fetch('/api/admin/registrations/batch', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: selected, status }),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) window.alert(result.message ?? '批量更新失败。');
    else {
      setSelected([]);
      router.refresh();
    }
    setSubmitting(null);
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-white/8 bg-[#0a0e14] p-4">
        <label className="flex cursor-pointer items-center gap-3 text-xs text-slate-400"><input type="checkbox" checked={registrations.length > 0 && selected.length === registrations.length} onChange={(event) => setSelected(event.target.checked ? registrations.map((item) => item.id) : [])} />全选当前结果 <span className="text-slate-600">已选 {selected.length}</span></label>
        <div className="flex flex-wrap gap-2">{batchActions.map((action) => <button key={action.status} type="button" disabled={selected.length === 0 || submitting !== null} onClick={() => updateBatch(action.status)} className="border border-white/12 px-3 py-2 text-[10px] font-black text-slate-300 disabled:opacity-35">{submitting === action.status ? '处理中…' : action.label}</button>)}</div>
      </div>
      <div className="mt-4 space-y-3">{registrations.map((registration) => (
        <article key={registration.id} className="border border-white/8 bg-[#0d1219] p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[auto_1.2fr_1fr_auto] lg:items-center">
            <input aria-label={`选择 ${registration.gameId}`} type="checkbox" checked={selected.includes(registration.id)} onChange={() => toggle(registration.id)} />
            <div>
              <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-black">{registration.gameId}</h2><StatusBadge status={registration.status} /></div>
              <p className="mt-2 text-sm text-slate-400">{registration.rankSnapshot} · {registration.primaryRole}{registration.secondaryRole ? ` / ${registration.secondaryRole}` : ''}</p>
              <p className="mt-1 text-xs text-slate-600">群昵称：{registration.groupNicknameSnapshot ?? '—'} · 提交：{formatDateTime(registration.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">{registration.tournament.name}</p>
              {registration.note ? <p className="mt-2 text-xs leading-5 text-slate-500">备注：{registration.note}</p> : <p className="mt-2 text-xs text-slate-700">无备注</p>}
            </div>
            <RegistrationActions registrationId={registration.id} />
          </div>
        </article>
      ))}</div>
      {registrations.length === 0 ? <p className="mt-6 border border-dashed border-white/12 p-8 text-center text-sm text-slate-600">没有符合筛选条件的报名。</p> : null}
    </>
  );
}
