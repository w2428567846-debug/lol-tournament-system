export type VerifiedWechatIdentity = {
  provider: 'WECHAT';
  appId: string;
  openId: string;
  unionId: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  verifiedAt: string;
};

export type WechatAuthorizationRequest = {
  state: string;
  returnTo: string;
};

export interface WechatOAuthAdapter {
  createAuthorizationUrl(request: WechatAuthorizationRequest): Promise<string>;
  exchangeVerifiedIdentity(input: { code: string; expectedState: string; receivedState: string }): Promise<VerifiedWechatIdentity>;
}

export interface VerifiedWechatAccountLinker {
  linkVerifiedIdentity(input: {
    authUserId: string;
    identity: VerifiedWechatIdentity;
  }): Promise<{ accountId: string }>;
}
