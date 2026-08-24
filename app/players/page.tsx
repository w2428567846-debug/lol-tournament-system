import type { Metadata } from 'next';
import Link from '@/components/navigation/safe-link';
import { PageIntro } from '@/components/layout/page-intro';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { SetupRequired } from '@/components/supabase/setup-required';
import { getPublicPlayerRoster } from '@/lib/players/queries';
import { playerRoleLabels } from '@/lib/registrations/labels';
import type { PlayerRole, PublicPlayerRosterEntry } from '@/types';

export const metadata: Metadata = { title: '选手花名册' };

const roles: Array<{ value: PlayerRole | ''; label: string }> = [
  { value: '', label: '全部位置' },
  { value: 'TOP', label: '上路' },
  { value: 'JUNGLE', label: '打野' },
  { value: 'MID', label: '中路' },
  { value: 'ADC', label: '下路' },
  { value: 'SUPPORT', label: '辅助' },
];

export default async function PlayersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search.trim() : '';
  const role = typeof params.role === 'string' && roles.some((item) => item.value === params.role) ? params.role as PlayerRole : '';
  const { players, configurationMissing } = await getPublicPlayerRoster();
  const needle = search.toLocaleLowerCase('zh-CN');
  const filtered = players.filter((player) => (!role || player.primaryRole === role)
    && (!needle || player.gameId.toLocaleLowerCase('zh-CN').includes(needle) || (player.latestTeamName ?? '').toLocaleLowerCase('zh-CN').includes(needle)));

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <SiteHeader />
      <PageIntro eyebrow="Player roster" title="社区选手花名册" description="查看选手段位、位置、虚拟费用与历届赛事表现。费用由管理员评定，只表示竞技水平，不涉及付款或真实货币。" />
      {configurationMissing ? <SetupRequired /> : (
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric value={String(players.length)} label="公开选手" />
            <Metric value={String(players.reduce((sum, player) => sum + player.matchesPlayed, 0))} label="累计对局" />
            <Metric value={String(players.reduce((sum, player) => sum + player.tournamentsPlayed, 0))} label="参赛人次" />
          </div>

          <form className="mt-8 grid gap-3 border border-white/8 bg-[#0d1219] p-4 sm:grid-cols-[1fr_180px_auto]">
            <input name="search" defaultValue={search} placeholder="搜索游戏 ID 或战队" className="min-h-11 border border-white/10 bg-[#080b10] px-4 text-sm text-white outline-none focus:border-[#d8b968]/55" />
            <select name="role" defaultValue={role} className="min-h-11 border border-white/10 bg-[#080b10] px-4 text-sm text-slate-300 outline-none focus:border-[#d8b968]/55">{roles.map((item) => <option key={item.value || 'ALL'} value={item.value}>{item.label}</option>)}</select>
            <button className="gold-button min-h-11 px-6 text-xs font-black text-[#080b10]">筛选花名册</button>
          </form>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {filtered.map((player) => <PlayerRosterCard key={player.gameId} player={player} />)}
          </div>
          {filtered.length === 0 ? <div className="mt-7 border border-dashed border-white/12 px-6 py-12 text-center text-sm text-slate-600">{players.length === 0 ? '公开赛事还没有已通过的选手。管理员审核报名并填写费用后，这里会自动出现。' : '没有符合筛选条件的选手。'}</div> : null}

          <div className="mt-12 border border-white/8 bg-[#0a0e14] p-6 text-sm leading-6 text-slate-500">
            这里只汇总已发布的公开赛事与已通过报名。私人赛事选手不会出现在公开花名册；每届赛事的战队、费用和数据分别保存，历史记录不会互相覆盖。
          </div>
        </section>
      )}
      <section className="border-y border-white/8 bg-[#0a0e14]"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d8b968]">Join a tournament</p><h2 className="mt-3 text-2xl font-black">想加入下一场比赛？</h2></div><Link href="/tournaments" className="gold-button inline-flex min-h-12 items-center px-7 text-sm font-black text-[#080b10]">浏览开放赛事 →</Link></div></section>
      <SiteFooter />
    </main>
  );
}

function PlayerRosterCard({ player }: { player: PublicPlayerRosterEntry }) {
  const kda = player.matchesPlayed === 0 ? '—' : ((player.kills + player.assists) / Math.max(player.deaths, 1)).toFixed(2);
  return (
    <article className="border border-white/9 bg-[#0d1219] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0"><h2 className="[overflow-wrap:anywhere] text-xl font-black">{player.gameId}</h2><p className="mt-2 text-sm text-slate-400">{player.rank} · {playerRoleLabels[player.primaryRole]}{player.secondaryRole ? ` / ${playerRoleLabels[player.secondaryRole]}` : ''}</p><p className="mt-1 text-xs text-slate-600">当前战队：{player.latestTeamName ?? '待分配'}</p></div>
        <div className="shrink-0 border border-[#d8b968]/30 bg-[#d8b968]/8 px-4 py-3 text-right"><p className="text-2xl font-black text-[#e6cc84]">{player.valuation == null ? '—' : player.valuation.toFixed(1)}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[.2em] text-[#d8b968]">费用</p></div>
      </div>
      <dl className="mt-5 grid grid-cols-4 gap-2 border-y border-white/8 py-4 text-center"><Stat value={`${player.wins}-${player.losses}`} label="胜负" /><Stat value={kda} label="KDA" /><Stat value={String(player.matchesPlayed)} label="场数" /><Stat value={String(player.tournamentsPlayed)} label="赛事" /></dl>
      <details className="group mt-4"><summary className="cursor-pointer list-none text-xs font-bold text-[#d8b968]">查看历届赛事数据 <span className="ml-1 inline-block transition group-open:rotate-90">→</span></summary><div className="mt-4 space-y-3">{player.history.map((history) => <div key={history.tournamentSlug} className="border border-white/8 bg-[#080b10] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/tournaments/${history.tournamentSlug}`} className="text-sm font-black text-slate-200 hover:text-[#e6cc84]">{history.tournamentName}</Link><p className="mt-1 text-xs text-slate-600">{history.teamName ?? '未分队'} · {playerRoleLabels[history.primaryRole]} · {history.rank}</p></div><span className="text-xs font-black text-[#d8b968]">{history.valuation == null ? '费用待定' : `${history.valuation.toFixed(1)} 费`}</span></div><p className="mt-3 text-xs text-slate-500">{history.matchesPlayed} 场 · {history.wins} 胜 {history.losses} 负 · {history.kills}/{history.deaths}/{history.assists}{history.placement ? ` · 第 ${history.placement} 名` : ''}</p></div>)}</div></details>
    </article>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="border border-white/9 bg-[#0d1219] p-5"><p className="text-3xl font-black">{value}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">{label}</p></div>; }
function Stat({ value, label }: { value: string; label: string }) { return <div><dt className="text-sm font-black text-slate-200">{value}</dt><dd className="mt-1 text-[9px] uppercase tracking-[.16em] text-slate-600">{label}</dd></div>; }
