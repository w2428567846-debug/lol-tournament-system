'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RegistrationStatus } from '@/types';

const actions: Array<{ status: RegistrationStatus; label: string; className: string }> = [
  { status: 'APPROVED', label: '通过', className: 'border-emerald-300/25 text-emerald-200' },
  { status: 'WAITLISTED', label: '候补', className: 'border-cyan-300/25 text-cyan-200' },
  { status: 'REJECTED', label: '拒绝', className: 'border-red-300/25 text-red-200' },
];

export function RegistrationActions({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<RegistrationStatus | null>(null);

  async function update(status: RegistrationStatus) {
    setSubmitting(status);
    const response = await fetch(`/api/admin/registrations/${registrationId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!response.ok) {
      const result = await response.json() as { message?: string };
      window.alert(result.message ?? '更新失败，请确认管理员权限后重试。');
    }
    router.refresh();
    setSubmitting(null);
  }

  return <div className="flex flex-wrap gap-2">{actions.map((action) => <button key={action.status} type="button" disabled={submitting !== null} onClick={() => update(action.status)} className={`border px-3 py-2 text-[10px] font-black ${action.className} disabled:opacity-40`}>{submitting === action.status ? '处理中…' : action.label}</button>)}</div>;
}
