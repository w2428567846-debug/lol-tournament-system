'use client';

import Link from '@/components/navigation/safe-link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import type { SupabasePublicConfig } from '@/lib/supabase/config';

export function AuthForm({ mode, config, returnTo, siteOrigin }: { mode: 'login' | 'register'; config: SupabasePublicConfig; returnTo: string; siteOrigin: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const supabase = createBrowserSupabaseClient(config);

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('登录失败，请检查邮箱、密码或邮箱验证状态。');
        setSubmitting(false);
        return;
      }
      router.replace(returnTo);
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteOrigin}/auth/callback?next=${encodeURIComponent(returnTo)}` },
    });

    if (signUpError) {
      setError(signUpError.message.includes('already') ? '这个邮箱已经注册。' : '注册失败，请稍后再试。');
      setSubmitting(false);
      return;
    }

    if (data.session) {
      router.replace(returnTo);
      router.refresh();
      return;
    }

    setMessage('账号已创建，请前往邮箱点击验证链接后登录。');
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-xs font-bold text-slate-300">测试邮箱</span>
        <input name="email" type="email" required autoComplete="email" className="mt-2 w-full border border-white/12 bg-[#080b10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b968]/60" placeholder="player@example.com" />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">密码</span>
        <input name="password" type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="mt-2 w-full border border-white/12 bg-[#080b10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b968]/60" placeholder="至少 8 个字符" />
      </label>
      {error ? <p role="alert" className="border border-red-300/20 bg-red-300/7 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p className="border border-emerald-300/20 bg-emerald-300/7 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
      <button disabled={submitting} className="gold-button flex min-h-12 w-full items-center justify-center px-6 text-sm font-black tracking-[.12em] text-[#080b10] disabled:cursor-wait disabled:opacity-60">
        {submitting ? '处理中…' : mode === 'login' ? '登录账户' : '创建账户'}
      </button>
      <p className="text-center text-xs text-slate-500">
        {mode === 'login' ? '还没有账户？' : '已经注册？'}{' '}
        <Link className="font-bold text-[#d8b968]" href={mode === 'login' ? `/register?returnTo=${encodeURIComponent(returnTo)}` : `/login?returnTo=${encodeURIComponent(returnTo)}`}>
          {mode === 'login' ? '立即注册' : '前往登录'}
        </Link>
      </p>
    </form>
  );
}
