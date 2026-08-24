'use client';

import Link from '@/components/navigation/safe-link';
import { usePathname } from 'next/navigation';

const adminNav = [
  ['/admin', 'OV', '总览'],
  ['/admin/tournaments', 'TR', '赛事管理'],
  ['/admin/players', 'PL', '选手数据'],
  ['/admin/registrations', 'RG', '报名审核'],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto p-4 lg:block lg:space-y-1 lg:p-4" aria-label="后台导航">
      {adminNav.map(([href, code, label]) => {
        const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 px-4 py-3 text-sm font-semibold transition ${active ? 'bg-[#d8b968]/10 text-[#e6cc84]' : 'text-slate-500 hover:bg-white/4 hover:text-slate-200'}`}>
            <span className="text-[9px] font-black tracking-widest">{code}</span>{label}
          </Link>
        );
      })}
    </nav>
  );
}
