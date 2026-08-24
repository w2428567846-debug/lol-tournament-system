import type { Metadata } from 'next';
import Link from '@/components/navigation/safe-link';
import { PageIntro } from '@/components/layout/page-intro';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export const metadata: Metadata = { title: '选手中心' };

const roles = [
  ['TOP', '上路', '承担边线压力与前排职责'],
  ['JUNGLE', '打野', '控制地图资源并带动节奏'],
  ['MID', '中路', '连接上下半区与核心输出'],
  ['ADC', '下路', '提供持续物理伤害'],
  ['SUPPORT', '辅助', '视野、开团与队伍保护'],
];

export default function PlayersPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <PageIntro eyebrow="Player hub" title="社区选手中心" description="报名时直接填写中国区游戏 ID、段位和位置；常用资料只是可选预填，不会阻挡首次报名。" />
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-4 md:grid-cols-3"><Feature code="01" title="直接报名" description="登录后即可填写本次赛事资料，无需预先建立档案。" /><Feature code="02" title="赛事快照" description="每次报名独立保存游戏 ID、段位和位置，历史记录不会被覆盖。" /><Feature code="03" title="资料分级保护" description="公开页面只显示经过审核的必要信息，完整资料仅本人和管理员可见。" /></div>
        <div className="mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Player roles</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">位置说明</h2></div><p className="max-w-md text-sm leading-6 text-slate-500">报名时可选择一个首选位置和一个不同的第二位置。</p></div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{roles.map(([code, title, description]) => <article key={code} className="border border-white/9 bg-[#0d1219] p-5"><span className="text-[10px] font-black tracking-[.18em] text-[#d8b968]">{code}</span><h3 className="mt-4 text-lg font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p></article>)}</div>
      </section>
      <section id="register" className="border-y border-white/8 bg-[#0a0e14]"><div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Join a tournament</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">准备好报名了吗？</h2><p className="mt-3 text-sm text-slate-500">选择开放赛事，登录后直接提交游戏 ID 即可。</p></div><div className="flex flex-wrap gap-3"><Link href="/tournaments" className="gold-button inline-flex min-h-12 items-center px-7 text-sm font-black text-[#080b10]">浏览开放赛事 →</Link><Link href="/account" className="inline-flex min-h-12 items-center border border-white/12 px-7 text-sm font-bold text-slate-300">查看我的报名</Link></div></div></section>
      <SiteFooter />
    </main>
  );
}

function Feature({ code, title, description }: { code: string; title: string; description: string }) { return <article className="border border-white/9 bg-[#0d1219] p-6"><span className="text-[10px] font-black tracking-[.18em] text-[#d8b968]">{code}</span><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{description}</p></article>; }
