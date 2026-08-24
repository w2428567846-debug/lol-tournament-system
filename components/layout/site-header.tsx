import Link from '@/components/navigation/safe-link';
import { getViewer } from '@/lib/auth/server';

const navigation = [
  { label: '首页', href: '/' },
  { label: '赛事', href: '/tournaments' },
  { label: '报名说明', href: '/players' },
  { label: '我的报名', href: '/account' },
];

export async function SiteHeader() {
  const viewer = await getViewer();
  return (
    <header className="relative z-50 border-b border-white/8 bg-[#080b10]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Rift Command 首页">
          <span className="grid h-10 w-10 place-items-center border border-[#d8b968]/50 bg-[#d8b968]/8 font-black text-[#d8b968]">RC</span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.15em] text-white">Rift Command</span>
            <span className="block text-[9px] uppercase tracking-[0.24em] text-slate-600">Tournament System</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="主要导航">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} className="text-sm font-semibold text-slate-400 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {viewer.account ? <Link href="/account" className="bg-[#d8b968] px-5 py-2.5 text-xs font-black text-[#080b10] transition hover:bg-[#edd58f]">我的账户</Link> : <Link href="/login" className="bg-[#d8b968] px-5 py-2.5 text-xs font-black text-[#080b10] transition hover:bg-[#edd58f]">微信登录</Link>}
          {viewer.isAdmin ? <Link href="/admin" className="border border-white/15 px-5 py-2.5 text-xs font-bold text-white transition hover:border-[#d8b968]/50 hover:text-[#d8b968]">管理后台</Link> : null}
        </div>

        <details className="group relative lg:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center border border-white/15 text-xl text-white marker:content-none">≡</summary>
          <nav className="absolute right-0 top-12 w-64 border border-white/10 bg-[#0d1219] p-3 shadow-2xl" aria-label="移动端导航">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} className="block border-b border-white/6 px-4 py-3 text-sm font-semibold text-slate-300 last:border-0">
                {item.label}
              </Link>
            ))}
            <Link href={viewer.account ? '/account' : '/login'} className="mt-3 block bg-[#d8b968] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-[#080b10]">{viewer.account ? '我的账户' : '微信登录'}</Link>
            {viewer.isAdmin ? <Link href="/admin" className="mt-3 block border border-white/12 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white">管理后台</Link> : null}
          </nav>
        </details>
      </div>
    </header>
  );
}
