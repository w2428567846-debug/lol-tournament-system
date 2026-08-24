import assert from 'node:assert/strict';
import test from 'node:test';
import { safeReturnTo } from '../lib/auth/return-to.ts';
import { getSiteOrigin } from '../lib/site-url.ts';
import { getSupabasePublicConfig } from '../lib/supabase/config.ts';

test('returnTo accepts only same-origin relative application paths', () => {
  assert.equal(safeReturnTo('/account?tab=registrations#current'), '/account?tab=registrations#current');
  assert.equal(safeReturnTo('https://evil.example/path'), '/account');
  assert.equal(safeReturnTo('//evil.example/path'), '/account');
  assert.equal(safeReturnTo('/\\evil.example/path'), '/account');
  assert.equal(safeReturnTo('javascript:alert(1)'), '/account');
  assert.equal(safeReturnTo(['/admin']), '/account');
});

test('site origin is canonical and invalid configuration fails safely', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://events.example.com/some/path';
    assert.equal(getSiteOrigin(), 'https://events.example.com');

    process.env.NEXT_PUBLIC_SITE_URL = 'javascript:alert(1)';
    assert.equal(getSiteOrigin(), 'http://localhost:3000');

    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(getSiteOrigin(), 'http://localhost:3000');
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  }
});

test('Supabase public configuration requires a valid HTTP origin and both values', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co/path';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'publishable-key';
    assert.deepEqual(getSupabasePublicConfig(), { url: 'https://project.supabase.co', anonKey: 'publishable-key' });

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
    assert.equal(getSupabasePublicConfig(), null);

    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(getSupabasePublicConfig(), null);
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  }
});
