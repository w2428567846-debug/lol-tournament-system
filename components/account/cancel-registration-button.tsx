'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CancelRegistrationButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function cancel() {
    if (!window.confirm('确定取消这次报名吗？取消后不能自行恢复。')) return;
    setSubmitting(true);
    const response = await fetch(`/api/registrations/${registrationId}/cancel`, { method: 'PATCH' });
    if (!response.ok) window.alert('取消失败，请刷新页面后重试。');
    router.refresh();
    setSubmitting(false);
  }

  return <button type="button" onClick={cancel} disabled={submitting} className="text-xs font-bold text-slate-500 transition hover:text-red-200 disabled:opacity-50">{submitting ? '处理中…' : '取消报名'}</button>;
}
