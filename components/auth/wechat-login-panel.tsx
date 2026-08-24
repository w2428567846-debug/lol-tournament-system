export function WechatLoginPanel({ credentialsConfigured, sessionBridgeReady }: { credentialsConfigured: boolean; sessionBridgeReady: boolean }) {
  const ready = credentialsConfigured && sessionBridgeReady;
  const status = !credentialsConfigured ? '等待微信开放平台 AppID 与密钥' : !sessionBridgeReady ? '等待可信服务端会话桥接' : '可用';

  return (
    <div className="border border-emerald-300/20 bg-[linear-gradient(145deg,rgba(52,211,153,.12),rgba(13,18,25,.98)_58%)] p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-400 text-lg font-black text-[#07110d]">微</span>
        <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-300">Primary identity</p><h2 className="mt-1 text-xl font-black text-white">微信身份登录</h2></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">首次通过微信 OAuth 验证后自动建立唯一账户。系统不会要求你手填微信号、OpenID 或 UnionID。</p>
      <button type="button" disabled={!ready} aria-disabled={!ready} className="mt-5 flex min-h-12 w-full items-center justify-center bg-emerald-400 px-6 text-sm font-black tracking-[.1em] text-[#07110d] disabled:cursor-not-allowed disabled:bg-emerald-400/20 disabled:text-emerald-100/50">
        {ready ? '使用微信安全登录' : '微信登录尚未启用'}
      </button>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-600">{status}</p>
    </div>
  );
}
