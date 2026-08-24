'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlayerProfile, PlayerRole, TournamentDetail, TournamentRegistration } from '@/types';

const roles: Array<{ value: PlayerRole; label: string }> = [
  { value: 'TOP', label: '上路' },
  { value: 'JUNGLE', label: '打野' },
  { value: 'MID', label: '中路' },
  { value: 'ADC', label: '下路' },
  { value: 'SUPPORT', label: '辅助' },
];

export function TournamentRegistrationForm({
  tournament,
  profile,
  registration,
}: {
  tournament: TournamentDetail;
  profile: PlayerProfile | null;
  registration: TournamentRegistration | null;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const editing = registration !== null;
  const resubmitting = registration?.status === 'REJECTED';
  const fieldClass = 'mt-2 w-full border border-white/12 bg-[#080b10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b968]/60';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(editing ? `/api/registrations/${registration.id}` : '/api/registrations', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, tournament_id: tournament.id, resubmit: resubmitting }),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) {
      setError(result.message ?? '报名资料未能保存，请稍后重试。');
      setSubmitting(false);
      return;
    }
    router.replace(`/account?${resubmitting ? 'resubmitted' : editing ? 'updated' : 'registered'}=${encodeURIComponent(tournament.slug)}`);
    router.refresh();
  }

  const gameId = registration?.gameId ?? profile?.gameId ?? '';
  const currentRank = registration?.rankSnapshot ?? profile?.currentRank ?? '';
  const primaryRole = registration?.primaryRole ?? profile?.primaryRole ?? 'MID';
  const secondaryRole = registration?.secondaryRole ?? profile?.secondaryRole ?? '';
  const groupNickname = registration?.groupNicknameSnapshot ?? profile?.groupNickname ?? '';

  return (
    <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
      {profile && !editing ? <p className="border border-cyan-300/15 bg-cyan-300/5 px-4 py-3 text-xs leading-5 text-cyan-100 sm:col-span-2">已用账户中保存的资料预填；你可以只为本次赛事修改，历史报名不会跟着账户资料变化。</p> : null}
      {editing && registration.status !== 'PENDING' && !resubmitting ? <p className="border border-amber-300/20 bg-amber-300/6 px-4 py-3 text-xs leading-5 text-amber-100 sm:col-span-2">修改游戏 ID、段位或位置后，这份报名会自动回到“等待审核”。</p> : null}
      {resubmitting ? <p className="border border-cyan-300/15 bg-cyan-300/5 px-4 py-3 text-xs leading-5 text-cyan-100 sm:col-span-2">修正资料并提交后，这份报名会重新进入“等待审核”。原审核记录会保留在系统日志中。</p> : null}
      <label className="sm:col-span-2">
        <span className="text-xs font-bold text-slate-300">游戏 ID</span>
        <input className={fieldClass} name="game_id" required maxLength={49} placeholder="玩家名字#12345" defaultValue={gameId} />
        <span className="mt-2 block text-[11px] text-slate-600">填写中国区游戏名称与编号，不需要绑定账号或选择服务器。</span>
      </label>
      <label>
        <span className="text-xs font-bold text-slate-300">当前段位</span>
        <input className={fieldClass} name="current_rank" required maxLength={40} placeholder="例如：翡翠 II" defaultValue={currentRank} />
      </label>
      <label>
        <span className="text-xs font-bold text-slate-300">群昵称</span>
        <input className={fieldClass} name="group_nickname" maxLength={50} placeholder="方便主办方在群内联系" defaultValue={groupNickname} />
      </label>
      <label>
        <span className="text-xs font-bold text-slate-300">首选位置</span>
        <select className={fieldClass} name="primary_role" defaultValue={primaryRole}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
      </label>
      <label>
        <span className="text-xs font-bold text-slate-300">第二位置</span>
        <select className={fieldClass} name="secondary_role" defaultValue={secondaryRole}><option value="">无</option>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
      </label>
      {!editing && tournament.visibility === 'PRIVATE' ? <label className="sm:col-span-2"><span className="text-xs font-bold text-slate-300">赛事邀请码</span><input className={fieldClass} name="invite_code" required autoComplete="off" placeholder="输入群内公布的邀请码" /><span className="mt-2 block text-[11px] text-slate-600">邀请码只发送至服务器验证，不会保存在浏览器中。</span></label> : null}
      <label className="sm:col-span-2"><span className="text-xs font-bold text-slate-300">给主办方的备注</span><textarea className={`${fieldClass} min-h-28 resize-y`} name="note" maxLength={500} defaultValue={registration?.note ?? ''} placeholder="可填写可参赛时间或其他说明（选填）" /></label>
      {error ? <p role="alert" className="border border-red-300/20 bg-red-300/7 px-4 py-3 text-sm text-red-200 sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2"><button disabled={submitting} className="gold-button min-h-12 px-8 text-sm font-black tracking-[.12em] text-[#080b10] disabled:opacity-60">{submitting ? '保存中…' : resubmitting ? '修改并重新提交' : editing ? '保存报名修改' : '确认提交报名'}</button></div>
    </form>
  );
}
