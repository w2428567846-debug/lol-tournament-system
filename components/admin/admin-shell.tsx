import Link from 'next/link';
import { AdminNav } from '@/components/admin/admin-nav';

export function AdminShell({ children, configured = true, userLabel }: { children: React.ReactNode; configured?: boolean; userLabel?: string | null }) {
  return (
    <div className="min-h-screen bg-[#080b10] text-white lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/8 bg-[#0a0e14] lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-20 items-center justify-between border-b border-white/8 px-5 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-[#d8b968] text-xs font-black text-[#080b10]">RC</span>
            <span><strong className="block text-sm uppercase tracking-[0.12em]">Admin Core</strong><small className="text-[9px] uppercase tracking-[0.2em] text-slate-600">Tournament ops</small></span>
          </Link>
          <Link href="/" className="text-xs text-slate-500 lg:hidden">返回首页</Link>
        </div>
        <AdminNav />
        <div className="mx-4 mt-4 hidden border border-white/8 p-4 lg:block">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Environment</p>
          <p className={`mt-2 text-xs font-bold ${configured ? 'text-emerald-300' : 'text-amber-200'}`}>● {configured ? 'Supabase connected' : 'Setup required'}</p>
          <p className="mt-1 text-[10px] leading-5 text-slate-600">{configured ? '后台操作受服务端管理员权限和 RLS 保护。' : '配置数据库后才能进入管理功能。'}</p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-20 items-center justify-between border-b border-white/8 bg-[#0a0e14]/70 px-5 sm:px-8">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Workspace</p><p className="mt-1 text-sm font-bold text-slate-200">Summer Championship 2026</p></div>
          <div className="flex items-center gap-3"><span className="hidden max-w-56 truncate text-xs text-slate-500 sm:block">{userLabel ?? '赛事管理员'}</span><span className="grid h-9 w-9 place-items-center border border-[#d8b968]/30 bg-[#d8b968]/8 text-xs font-black text-[#d8b968]">AD</span></div>
        </header>
        {children}
      </div>
    </div>
  );
}
