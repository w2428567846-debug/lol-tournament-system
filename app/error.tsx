'use client';

import Link from 'next/link';

export default function ApplicationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080b10] px-5 text-white">
      <section className="w-full max-w-xl border border-red-300/20 bg-[#0d1219] p-7 sm:p-10">
        <p className="text-[10px] font-black uppercase tracking-[.26em] text-red-200">Service temporarily unavailable</p>
        <h1 className="mt-3 text-3xl font-black">暂时无法载入此页面</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">连接可能暂时中断，或服务正在更新。请稍后重试；你的密码、登录凭据和报名资料不会显示在这里。</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="gold-button min-h-11 px-5 text-xs font-black text-[#080b10]">重新载入</button>
          <Link href="/" className="flex min-h-11 items-center border border-white/12 px-5 text-xs font-bold text-slate-200">返回首页</Link>
        </div>
      </section>
    </main>
  );
}
