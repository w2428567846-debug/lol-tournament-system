import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { WechatLoginPanel } from '@/components/auth/wechat-login-panel';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SetupRequired } from '@/components/supabase/setup-required';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { getWechatOAuthReadiness, isDevelopmentEmailAuthEnabled } from '@/lib/auth/config';
import { safeReturnTo } from '@/lib/auth/return-to';
import { getSiteOrigin } from '@/lib/site-url';

export const metadata: Metadata = { title: '登录' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const config = getSupabasePublicConfig();
  const returnTo = safeReturnTo(params.returnTo);
  const wechat = getWechatOAuthReadiness();
  const emailDevEnabled = isDevelopmentEmailAuthEnabled();
  const siteOrigin = getSiteOrigin();

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-md px-5 py-16 sm:py-24">
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">← 返回首页</Link>
          <div className="mt-6">
            <p className="text-[10px] font-black uppercase tracking-[.28em] text-[#d8b968]">Community identity</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">登录 Rift Command</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">正式身份以经过 OAuth 验证的微信账户为准，一份微信身份只能对应一个 Rift Command 账户。</p>
            <div className="mt-8"><WechatLoginPanel credentialsConfigured={wechat.credentialsConfigured} sessionBridgeReady={wechat.sessionBridgeReady} /></div>
            {!config ? <div className="mt-5"><SetupRequired compact /></div> : null}
            {config && emailDevEnabled ? <details className="mt-5 border border-white/10 bg-[#0d1219] p-5"><summary className="cursor-pointer text-xs font-black text-slate-400">开发／测试：邮箱登录</summary><p className="mt-3 text-xs leading-5 text-amber-200/70">此入口只用于开发验证，不是产品正式身份。</p><AuthForm mode="login" config={config} returnTo={returnTo} siteOrigin={siteOrigin} /></details> : null}
          </div>
        </section>
      <SiteFooter />
    </main>
  );
}
