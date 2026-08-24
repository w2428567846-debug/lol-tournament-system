import Link from 'next/link';

const adminNav = [
  ['OV', '总览'],
  ['TR', '赛事管理'],
  ['TM', '战队管理'],
  ['PL', '选手管理'],
  ['GP', '小组管理'],
  ['MT', '比赛管理'],
  ['BR', '淘汰赛管理'],
  ['AN', '公告管理'],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
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
        <nav className="flex gap-2 overflow-x-auto p-4 lg:block lg:space-y-1 lg:p-4" aria-label="后台导航">
          {adminNav.map(([code, label], index) => (
            <Link key={label} href="/admin" className={`flex shrink-0 items-center gap-3 px-4 py-3 text-sm font-semibold transition ${index === 0 ? 'bg-[#d8b968]/10 text-[#e6cc84]' : 'text-slate-500 hover:bg-white/4 hover:text-slate-200'}`}>
              <span className="text-[9px] font-black tracking-widest">{code}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="mx-4 mt-4 hidden border border-white/8 p-4 lg:block">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Environment</p>
          <p className="mt-2 text-xs font-bold text-emerald-300">● UI Preview</p>
          <p className="mt-1 text-[10px] leading-5 text-slate-600">数据库和权限系统将在下一阶段接入。</p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-20 items-center justify-between border-b border-white/8 bg-[#0a0e14]/70 px-5 sm:px-8">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Workspace</p><p className="mt-1 text-sm font-bold text-slate-200">Summer Championship 2026</p></div>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-slate-500 sm:block">赛事管理员</span><span className="grid h-9 w-9 place-items-center border border-[#d8b968]/30 bg-[#d8b968]/8 text-xs font-black text-[#d8b968]">AD</span></div>
        </header>
        {children}
      </div>
    </div>
  );
}
