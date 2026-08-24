import Link from 'next/link';

export function SetupRequired({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? '' : 'mx-auto max-w-3xl px-5 py-16 sm:px-8'}>
      <div className="border border-amber-300/20 bg-amber-300/6 p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[.26em] text-amber-200">Database setup required</p>
        <h1 className="mt-3 text-2xl font-black text-white">尚未连接 Supabase</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Phase 2 页面和安全逻辑已经就绪。配置项目网址与公开 anon key，并执行 migration 后即可启用真实注册流程。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tournaments" className="border border-white/12 px-4 py-2.5 text-xs font-bold text-slate-200">返回赛事中心</Link>
          <span className="px-4 py-2.5 text-xs font-semibold text-slate-600">设置说明：supabase/README.md</span>
        </div>
      </div>
    </section>
  );
}
