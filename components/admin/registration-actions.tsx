'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { canAdminReviewRegistration, isRosterFrozen } from '@/lib/tournaments/domain';
import type { RegistrationStatus, TournamentStatus } from '@/types';

const actions: Array<{ status: RegistrationStatus; label: string; className: string }> = [
  { status: 'APPROVED', label: '通过', className: 'border-emerald-300/25 text-emerald-200' },
  { status: 'WAITLISTED', label: '候补', className: 'border-cyan-300/25 text-cyan-200' },
  { status: 'REJECTED', label: '拒绝', className: 'border-red-300/25 text-red-200' },
];

export function RegistrationActions({
  registrationId,
  status,
  tournamentStatus,
  currentNote,
}: {
  registrationId: string;
  status: RegistrationStatus;
  tournamentStatus: TournamentStatus;
  currentNote: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<RegistrationStatus | null>(null);
  const [reviewNote, setReviewNote] = useState(currentNote ?? '');
  const availableActions = actions.filter((action) => canAdminReviewRegistration({
    fromStatus: status,
    toStatus: action.status,
    tournamentStatus,
  }));

  async function update(status: RegistrationStatus) {
    setSubmitting(status);
    const response = await fetch(`/api/admin/registrations/${registrationId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, review_note: reviewNote }),
    });
    if (!response.ok) {
      const result = await response.json() as { message?: string };
      window.alert(result.message ?? '更新失败，请确认管理员权限后重试。');
    }
    router.refresh();
    setSubmitting(null);
  }

  if (isRosterFrozen(tournamentStatus)) return <p className="text-xs font-bold text-amber-200">名单已锁定，禁止审核</p>;
  if (availableActions.length === 0) return <p className="text-xs text-slate-600">当前状态无可用审核操作</p>;

  return (
    <div className="min-w-52 space-y-3">
      <label className="block">
        <span className="text-[10px] font-bold text-slate-500">审核备注（选填）</span>
        <textarea
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          maxLength={500}
          placeholder="例如：资料不完整或候补说明"
          className="mt-1 min-h-16 w-full resize-y border border-white/10 bg-[#080b10] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#d8b968]/50"
        />
      </label>
      <div className="flex flex-wrap gap-2">{availableActions.map((action) => <button key={action.status} type="button" disabled={submitting !== null} onClick={() => update(action.status)} className={`border px-3 py-2 text-[10px] font-black ${action.className} disabled:opacity-40`}>{submitting === action.status ? '处理中…' : action.label}</button>)}</div>
    </div>
  );
}
