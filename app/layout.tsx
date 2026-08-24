import type { Metadata } from 'next';
import './globals.css';

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: 'Rift Command | 英雄联盟赛事管理系统',
    template: '%s | Rift Command',
  },
  description: '专业的英雄联盟赛事组织与管理平台，覆盖赛事、战队、赛程、比分、积分和淘汰赛。',
  icons: { icon: '/og.png' },
  openGraph: {
    title: 'Rift Command | 英雄联盟赛事管理系统',
    description: '专业的赛事组织与管理平台，从赛程编排到比分结算与自动晋级。',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: 'Rift Command Tournament Management System' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rift Command | 英雄联盟赛事管理系统',
    description: '专业的赛事组织与管理平台，从赛程编排到比分结算与自动晋级。',
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
