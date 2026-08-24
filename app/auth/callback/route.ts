import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { safeReturnTo } from '@/lib/auth/return-to';
import { getSiteOrigin } from '@/lib/site-url';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteOrigin = getSiteOrigin();
  const code = url.searchParams.get('code');
  const next = safeReturnTo(url.searchParams.get('next'));

  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL('/login?error=not_configured', siteOrigin));
  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, siteOrigin));
  }

  return NextResponse.redirect(new URL('/login?error=callback_failed', siteOrigin));
}
