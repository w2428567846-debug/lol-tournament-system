'use client';

import { useState } from 'react';

export type RegistrationSharePayload = {
  tournamentSlug: string;
  registrationUrl: string;
};

export function RegistrationShareActions({ slug, qrEndpoint }: { slug: string; qrEndpoint?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyRegistrationLink() {
    const registrationUrl = `${window.location.origin}/tournaments/${slug}/register`;
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('复制报名链接', registrationUrl);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copyRegistrationLink} className="border border-[#d8b968]/35 px-3 py-2 text-[10px] font-black text-[#d8b968]">{copied ? '已复制报名链接' : '复制报名链接'}</button>
      <button type="button" disabled={!qrEndpoint} title={qrEndpoint ? '生成分享二维码' : '二维码服务将在后续接入'} className="border border-white/10 px-3 py-2 text-[10px] font-black text-slate-500 disabled:cursor-not-allowed disabled:opacity-55">分享二维码（待接入）</button>
    </div>
  );
}
