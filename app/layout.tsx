import type { Metadata } from 'next';
import { getSiteOrigin } from '@/lib/site-url';
import './globals.css';

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: 'Rift Command | 英雄联盟赛事管理系统',
    template: '%s | Rift Command',
  },
  description: '面向私人英雄联盟社区的赛事报名与管理平台，覆盖选手档案、私人邀请码、报名审核与赛事信息。',
  icons: { icon: '/og.png' },
  openGraph: {
    title: 'Rift Command | 英雄联盟赛事管理系统',
    description: '社区赛事报名与管理平台，支持选手档案、私人邀请码和报名审核。',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: 'Rift Command Tournament Management System' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rift Command | 英雄联盟赛事管理系统',
    description: '社区赛事报名与管理平台，支持选手档案、私人邀请码和报名审核。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
