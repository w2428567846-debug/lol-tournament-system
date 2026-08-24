import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SetupRequired } from '@/components/supabase/setup-required';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

export const metadata: Metadata = { title: '注册' };

function safeReturnTo(value: string | string[] | undefined) {
  const candidate = typeof value === 'string' ? value : '/account';
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/account';
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const config = getSupabasePublicConfig();
  const returnTo = safeReturnTo(params.returnTo);

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      {!config ? <SetupRequired /> : (
        <section className="mx-auto max-w-md px-5 py-16 sm:py-24">
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">← 返回首页</Link>
          <div className="mt-6 border border-white/10 bg-[#0d1219] p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[.28em] text-[#d8b968]">Join the community</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">创建玩家账户</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">使用邮箱注册。私人联系方式不会出现在公开选手信息中。</p>
            <AuthForm mode="register" config={config} returnTo={returnTo} />
          </div>
        </section>
      )}
      <SiteFooter />
    </main>
  );
}
