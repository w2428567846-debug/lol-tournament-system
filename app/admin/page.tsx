import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminMetrics } from '@/lib/admin/queries';

export const metadata: Metadata = { title: '管理后台' };

export default async function AdminDashboard() {
  const metrics = await getAdminMetrics();
  if (!metrics) return null;
  const items = [
    [String(metrics.tournaments).padStart(2, '0'), '赛事数量', '数据库赛事'],
    [String(metrics.players).padStart(2, '0'), '选手档案', '已完成资料'],
    [String(metrics.pending).padStart(2, '0'), '待审核报名', '需要处理'],
    [String(metrics.approved).padStart(2, '0'), '已通过报名', '当前有效'],
  ];

  return (
    <main className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d8b968]">Operations overview</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">后台总览</h1><p className="mt-3 text-sm text-slate-500">真实数据库统计与待审核工作入口。</p></div>
        <Link href="/admin/registrations?status=PENDING" className="bg-[#d8b968] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#080b10]">处理待审核报名</Link>
      </div>
      <section className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([value, label, note]) => <article key={label} className="border border-white/8 bg-[#0d1219] p-5"><p className="text-3xl font-black tracking-tight">{value}</p><p className="mt-4 text-sm font-bold text-slate-200">{label}</p><p className="mt-1 text-xs text-slate-600">{note}</p></article>)}
      </section>
      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <AdminShortcut href="/admin/tournaments" code="TR" title="赛事管理" description="查看数据库中的赛事状态、可见性和报名周期。" />
        <AdminShortcut href="/admin/players" code="PL" title="选手管理" description="查看报名社区的玩家档案与 Riot ID。" />
        <AdminShortcut href="/admin/registrations" code="RG" title="报名审核" description="筛选、检索并审核个人赛事报名。" />
      </section>
    </main>
  );
}

function AdminShortcut({ href, code, title, description }: { href: string; code: string; title: string; description: string }) {
  return <Link href={href} className="group border border-white/8 bg-[#0d1219] p-6 transition hover:border-[#d8b968]/35"><span className="text-[10px] font-black tracking-[.2em] text-[#d8b968]">{code}</span><h2 className="mt-4 text-xl font-black group-hover:text-[#e6cc84]">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></Link>;
}
