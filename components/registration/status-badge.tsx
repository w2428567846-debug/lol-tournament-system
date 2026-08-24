import type { RegistrationStatus } from '@/types';

const statusStyles: Record<RegistrationStatus, string> = {
  PENDING: 'border-amber-300/25 bg-amber-300/8 text-amber-200',
  APPROVED: 'border-emerald-300/25 bg-emerald-300/8 text-emerald-200',
  WAITLISTED: 'border-cyan-300/25 bg-cyan-300/8 text-cyan-200',
  REJECTED: 'border-red-300/25 bg-red-300/8 text-red-200',
  CANCELLED: 'border-slate-500/25 bg-slate-500/8 text-slate-400',
};

const statusLabels: Record<RegistrationStatus, string> = {
  PENDING: '等待审核',
  APPROVED: '已通过',
  WAITLISTED: '候补名单',
  REJECTED: '未通过',
  CANCELLED: '已取消',
};

export function StatusBadge({ status }: { status: RegistrationStatus }) {
  return <span className={`inline-flex border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}
