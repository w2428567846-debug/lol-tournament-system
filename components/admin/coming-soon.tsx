export function AdminComingSoon({ title }: { title: string }) {
  return <main className="px-5 py-8 sm:px-8 sm:py-10"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d8b968]">Coming soon</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">{title}</h1><div className="mt-8 border border-dashed border-white/12 p-10 text-center"><p className="text-sm text-slate-500">此模块已有独立路由，将在对应开发阶段实现。</p></div></main>;
}
