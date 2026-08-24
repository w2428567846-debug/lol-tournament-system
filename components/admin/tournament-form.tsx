'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegistrationShareActions } from '@/components/tournament/registration-share-actions';
import { tournamentStatusDescriptions, tournamentStatusLabels } from '@/lib/tournaments/status';
import type { Tournament } from '@/types';

function dateTimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TournamentForm({ tournament }: { tournament?: Tournament }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState('');
  const fieldClass = 'mt-2 w-full border border-white/12 bg-[#080b10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b968]/60';

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value || 'SAVE_DRAFT';
    setSubmitting(intent);
    setError('');
    setMessage('');
    const body = { ...Object.fromEntries(new FormData(event.currentTarget)), intent };
    const response = await fetch(tournament ? `/api/admin/tournaments/${tournament.id}` : '/api/admin/tournaments', {
      method: tournament ? 'PUT' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json() as { message?: string; tournament?: { id: string } };
    if (!response.ok) setError(result.message ?? '赛事资料未能保存。');
    else if (!tournament && result.tournament) router.push(`/admin/tournaments/${result.tournament.id}/edit?created=1`);
    else {
      setMessage('赛事资料已保存。');
      router.refresh();
    }
    setSubmitting('');
  }

  async function transition(action: string) {
    if (!tournament) return;
    setSubmitting(action);
    setError('');
    setMessage('');
    const response = await fetch(`/api/admin/tournaments/${tournament.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) setError(result.message ?? '赛事状态更新失败。');
    else {
      setMessage('赛事状态已更新。');
      router.refresh();
    }
    setSubmitting('');
  }

  return (
    <>
      {tournament ? <div className="mt-7 flex flex-col gap-4 border border-white/9 bg-[#0d1219] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#d8b968]">当前状态</p><p className="mt-2 font-black text-white">{tournamentStatusLabels[tournament.status]}</p><p className="mt-1 text-xs text-slate-500">{tournamentStatusDescriptions[tournament.status]}</p></div><RegistrationShareActions slug={tournament.slug} /></div> : null}
      <form onSubmit={save} className="mt-6 grid gap-5 border border-white/9 bg-[#0d1219] p-6 sm:grid-cols-2 sm:p-8">
        <label><span className="text-xs font-bold text-slate-300">赛事名称</span><input className={fieldClass} name="name" required minLength={3} maxLength={100} defaultValue={tournament?.name ?? ''} /></label>
        <label><span className="text-xs font-bold text-slate-300">链接标识</span><input className={fieldClass} name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="community-cup-09" defaultValue={tournament?.slug ?? ''} /></label>
        <label className="sm:col-span-2"><span className="text-xs font-bold text-slate-300">赛事说明</span><textarea className={`${fieldClass} min-h-24 resize-y`} name="description" defaultValue={tournament?.description ?? ''} /></label>
        <label className="sm:col-span-2"><span className="text-xs font-bold text-slate-300">赛事规则</span><textarea className={`${fieldClass} min-h-36 resize-y`} name="rules" defaultValue={tournament?.rules ?? ''} /></label>
        <label><span className="text-xs font-bold text-slate-300">报名开始</span><input className={fieldClass} type="datetime-local" name="registration_start_at" required defaultValue={dateTimeLocal(tournament?.registrationStartAt)} /></label>
        <label><span className="text-xs font-bold text-slate-300">报名结束</span><input className={fieldClass} type="datetime-local" name="registration_end_at" required defaultValue={dateTimeLocal(tournament?.registrationEndAt)} /></label>
        <label><span className="text-xs font-bold text-slate-300">赛事开始</span><input className={fieldClass} type="datetime-local" name="start_at" required defaultValue={dateTimeLocal(tournament?.startAt)} /></label>
        <label><span className="text-xs font-bold text-slate-300">赛事结束</span><input className={fieldClass} type="datetime-local" name="end_at" required defaultValue={dateTimeLocal(tournament?.endAt)} /></label>
        <label><span className="text-xs font-bold text-slate-300">正式通过名额</span><input className={fieldClass} type="number" name="player_limit" min={1} placeholder="例如：40" defaultValue={tournament?.playerLimit ?? ''} /></label>
        <label><span className="text-xs font-bold text-slate-300">队伍上限（选填）</span><input className={fieldClass} type="number" name="team_limit" min={1} defaultValue={tournament?.teamLimit ?? ''} /></label>
        <label><span className="text-xs font-bold text-slate-300">报名类型</span><select className={fieldClass} name="registration_type" defaultValue={tournament?.registrationType ?? 'SOLO'}><option value="SOLO">个人报名</option><option value="TEAM">队伍报名</option><option value="BOTH">个人与队伍</option></select></label>
        <label><span className="text-xs font-bold text-slate-300">可见性</span><select className={fieldClass} name="visibility" defaultValue={tournament?.visibility ?? 'PRIVATE'}><option value="PRIVATE">私人链接</option><option value="UNLISTED">不在列表显示</option><option value="PUBLIC">公开</option></select></label>
        <label><span className="text-xs font-bold text-slate-300">赛事结构</span><select className={fieldClass} name="format" defaultValue={tournament?.format ?? 'GROUP_KNOCKOUT'}><option value="GROUP">小组</option><option value="KNOCKOUT">淘汰</option><option value="GROUP_KNOCKOUT">小组 + 淘汰</option></select></label>
        <label><span className="text-xs font-bold text-slate-300">默认比赛局数</span><select className={fieldClass} name="default_best_of" defaultValue={tournament?.defaultBestOf ?? 3}><option value="1">BO1</option><option value="3">BO3</option><option value="5">BO5</option></select></label>
        <label className="sm:col-span-2"><span className="text-xs font-bold text-slate-300">私人赛事邀请码</span><input className={fieldClass} name="invite_code" autoComplete="new-password" placeholder={tournament ? '留空表示保持现有邀请码' : '私人赛事必须填写'} /><span className="mt-2 block text-[11px] text-slate-600">保存时由数据库加密；后台不会读取原始邀请码。</span></label>
        {error ? <p role="alert" className="border border-red-300/20 bg-red-300/7 px-4 py-3 text-sm text-red-200 sm:col-span-2">{error}</p> : null}
        {message ? <p className="border border-emerald-300/20 bg-emerald-300/7 px-4 py-3 text-sm text-emerald-200 sm:col-span-2">{message}</p> : null}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button type="submit" value="SAVE_DRAFT" disabled={Boolean(submitting)} className="border border-white/14 px-5 py-3 text-xs font-black text-slate-200 disabled:opacity-40">{submitting === 'SAVE_DRAFT' ? '保存中…' : tournament ? '保存修改' : '保存草稿'}</button>
          {!tournament ? <button type="submit" value="OPEN_REGISTRATION" disabled={Boolean(submitting)} className="bg-[#d8b968] px-5 py-3 text-xs font-black text-[#080b10] disabled:opacity-40">创建并开放报名</button> : null}
          {tournament?.status === 'DRAFT' || tournament?.status === 'REGISTRATION_CLOSED' ? <button type="button" disabled={Boolean(submitting)} onClick={() => transition('OPEN_REGISTRATION')} className="bg-[#d8b968] px-5 py-3 text-xs font-black text-[#080b10] disabled:opacity-40">开放报名</button> : null}
          {tournament?.status === 'REGISTRATION' ? <button type="button" disabled={Boolean(submitting)} onClick={() => transition('CLOSE_REGISTRATION')} className="border border-amber-300/30 px-5 py-3 text-xs font-black text-amber-200 disabled:opacity-40">关闭报名</button> : null}
          {tournament?.status === 'REGISTRATION_CLOSED' ? <button type="button" disabled={Boolean(submitting)} onClick={() => transition('LOCK_ROSTER')} className="border border-red-300/30 px-5 py-3 text-xs font-black text-red-200 disabled:opacity-40">锁定名单</button> : null}
        </div>
      </form>
    </>
  );
}
