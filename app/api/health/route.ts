import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      application: 'available',
      databaseConfiguration: isSupabaseConfigured() ? 'available' : 'missing',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
