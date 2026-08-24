import { isSupabaseConfigured } from '@/lib/supabase/config';

export function isDevelopmentEmailAuthEnabled() {
  return isSupabaseConfigured() && process.env.ENABLE_EMAIL_DEV_AUTH === 'true';
}

export function getWechatOAuthReadiness() {
  const credentialsConfigured = Boolean(
    process.env.WECHAT_APP_ID?.trim()
    && process.env.WECHAT_APP_SECRET?.trim()
    && process.env.WECHAT_OAUTH_REDIRECT_URI?.trim(),
  );

  return {
    credentialsConfigured,
    sessionBridgeReady: false,
  };
}
