import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from '@/components/layout/page-intro';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { PlayerCard } from '@/components/player/player-card';
import { players } from '@/lib/sample-data';

export const metadata: Metadata = { title: '选手中心' };

const roleCounts = [
  ['上路', 32, 'bg-orange-300'],
  ['打野', 29, 'bg-emerald-300'],
  ['中路', 34, 'bg-violet-300'],
  ['下路', 31, 'bg-cyan-300'],
  ['辅助', 30, 'bg-[#d8b968]'],
];

export default function PlayersPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <PageIntro
        eyebrow="Player hub"
        title="选手中心"
        description="查看参赛选手、位置、段位与赛事评分。完成数据库接入后，选手可创建个人档案并加入战队。"
      />

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['156', '注册选手'],
            ['24', '自由选手'],
            ['38', '活跃战队'],
            ['9.8', '最高评分'],
          ].map(([value, label]) => (
            <div key={label} className="border border-white/9 bg-[#0d1219] px-6 py-5">
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[.2em] text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex items-end justify-between gap-6 border-b border-white/8 pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Featured roster</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-white">高评分选手</h2>
          </div>
          <span className="text-xs font-semibold text-slate-600">演示数据</span>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player, index) => <PlayerCard key={player.id} player={player} index={index} />)}
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0a0e14]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:px-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Role distribution</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-white">位置分布</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">快速查看报名池的阵容结构，方便主办方与战队发现当前最紧缺的位置。</p>
          </div>
          <div className="space-y-5">
            {roleCounts.map(([label, count, tone]) => (
              <div key={label} className="grid grid-cols-[52px_1fr_38px] items-center gap-4">
                <span className="text-sm font-bold text-slate-300">{label}</span>
                <span className="h-2 overflow-hidden bg-white/6"><span className={`block h-full ${tone}`} style={{ width: `${Number(count) / 34 * 100}%` }} /></span>
                <span className="text-right text-sm font-black text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="register" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden border border-[#d8b968]/25 bg-[linear-gradient(115deg,rgba(216,185,104,.16),rgba(13,18,25,.96)_44%,rgba(34,211,238,.08))] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Open registration</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">准备好上场了吗？</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">选手注册功能将在登录与数据库阶段正式开放。目前可先浏览页面与报名流程骨架。</p>
          </div>
          <Link href="/teams" className="gold-button mt-7 inline-flex min-h-12 items-center justify-center px-7 text-sm font-black tracking-[.12em] text-[#080b10] lg:mt-0">
            查看招募战队 →
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
