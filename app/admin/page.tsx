import type { Metadata } from 'next';
import { MatchCard } from '@/components/match/match-card';
import { recentResults, upcomingMatches } from '@/lib/sample-data';

export const metadata: Metadata = { title: '管理后台' };

const metrics = [
  ['03', '赛事数量', '+1 本月'],
  ['16', '战队数量', '16 已审核'],
  ['94', '选手数量', '88 首发'],
  ['02', '今日比赛', '下一场 20:00'],
  ['00', '进行中', '当前无直播'],
  ['15', '已完成比赛', '46% 进度'],
];

export default function AdminDashboard() {
  return (
    <main className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d8b968]">Operations overview</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">后台总览</h1><p className="mt-3 text-sm text-slate-500">监控赛事状态、比赛安排和平台基础数据。</p></div>
        <button type="button" className="bg-[#d8b968] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#080b10]">＋ 创建赛事</button>
      </div>

      <section className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([value, label, note]) => (
          <article key={label} className="border border-white/8 bg-[#0d1219] p-5">
            <div className="flex items-start justify-between"><p className="text-3xl font-black tracking-tight">{value}</p><span className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400">Live data</span></div>
            <p className="mt-4 text-sm font-bold text-slate-200">{label}</p><p className="mt-1 text-xs text-slate-600">{note}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-2">
        <div><DashboardHeading title="即将开始" action="管理比赛" /><div className="mt-4 space-y-3">{upcomingMatches.map((match) => <MatchCard key={match.id} match={match} compact />)}</div></div>
        <div><DashboardHeading title="最近结果" action="查看记录" /><div className="mt-4 space-y-3">{recentResults.map((match) => <MatchCard key={match.id} match={match} compact />)}</div></div>
      </section>

      <section className="mt-10 border border-white/8 bg-[#0d1219] p-6">
        <DashboardHeading title="赛事活动" action="查看全部" />
        <div className="mt-5 space-y-0">
          {[
            ['比分已确认', 'T1 2 : 1 HLE', '18 分钟前'],
            ['战队审核通过', 'Kagoshima Ravens', '1 小时前'],
            ['赛程已调整', 'Match 015 延后至 22:30', '3 小时前'],
          ].map(([title, detail, time]) => <div key={title} className="grid gap-1 border-t border-white/6 py-4 first:border-0 sm:grid-cols-[150px_1fr_auto]"><p className="text-sm font-bold text-slate-200">{title}</p><p className="text-sm text-slate-500">{detail}</p><p className="text-xs text-slate-700">{time}</p></div>)}
        </div>
      </section>
    </main>
  );
}

function DashboardHeading({ title, action }: { title: string; action: string }) {
  return <div className="flex items-center justify-between"><h2 className="text-lg font-black text-white">{title}</h2><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d8b968]">{action} →</span></div>;
}
