export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="relative overflow-hidden border-b border-white/8 bg-[#0a0e14]">
      <div className="hero-grid absolute inset-0 opacity-25" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d8b968]">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] text-white sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">{description}</p>
      </div>
    </section>
  );
}
