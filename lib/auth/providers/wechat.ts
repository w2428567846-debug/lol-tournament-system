import type { VerifiedWechatIdentity, WechatAuthorizationRequest, WechatOAuthAdapter } from '@/lib/auth/providers/types';

export class WechatOAuthNotConfiguredError extends Error {
  constructor() {
    super('WECHAT_OAUTH_NOT_CONFIGURED');
  }
}

/**
 * Provider boundary for a future verified WeChat OAuth implementation.
 * OpenID and UnionID must only come from exchangeVerifiedIdentity after a
 * successful provider callback; never populate them from form input.
 */
export class UnconfiguredWechatOAuthAdapter implements WechatOAuthAdapter {
  async createAuthorizationUrl(request: WechatAuthorizationRequest): Promise<string> {
    void request;
    throw new WechatOAuthNotConfiguredError();
  }

  async exchangeVerifiedIdentity(input: { code: string; expectedState: string; receivedState: string }): Promise<VerifiedWechatIdentity> {
    void input;
    throw new WechatOAuthNotConfiguredError();
  }
}
