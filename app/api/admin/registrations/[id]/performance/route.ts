import { NextResponse } from 'next/server';
import { authGuardErrorResponse } from '@/lib/auth/api-response';
import { getAdminClient } from '@/lib/auth/server';

function nullableText(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

function nullableNumber(value: unknown) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function nonNegativeInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function updateErrorMessage(message = '') {
  if (message.includes('registration_record_within_matches')) return '胜场与负场之和不能大于比赛场数。';
  if (message.includes('registration_valuation_range')) return '虚拟费用必须在 0 到 99.9 之间。';
  if (message.includes('ADMIN_STATS_REVIEW_SEPARATE')) return '请分别保存审核状态和赛事数据。';
  return '报名记录不存在，或赛事数据无法更新。';
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminClient();
  if ('error' in admin) return authGuardErrorResponse(admin.error);

  const body = await request.json() as Record<string, unknown>;
  const valuation = nullableNumber(body.valuation);
  const placement = nullableNumber(body.placement);
  const teamName = nullableText(body.team_name);
  const matchesPlayed = nonNegativeInteger(body.matches_played);
  const wins = nonNegativeInteger(body.wins);
  const losses = nonNegativeInteger(body.losses);
  const kills = nonNegativeInteger(body.kills);
  const deaths = nonNegativeInteger(body.deaths);
  const assists = nonNegativeInteger(body.assists);

  if (Number.isNaN(valuation) || (valuation != null && (valuation < 0 || valuation > 99.9))) {
    return NextResponse.json({ message: '虚拟费用必须是 0 到 99.9 之间的数字。' }, { status: 400 });
  }
  if (teamName && teamName.length > 80) return NextResponse.json({ message: '战队名称不能超过 80 个字符。' }, { status: 400 });
  if (Number.isNaN(placement) || (placement != null && (!Number.isSafeInteger(placement) || placement < 1))) {
    return NextResponse.json({ message: '最终名次必须是大于 0 的整数。' }, { status: 400 });
  }
  if ([matchesPlayed, wins, losses, kills, deaths, assists].some(Number.isNaN)) {
    return NextResponse.json({ message: '比赛数据必须是大于或等于 0 的整数。' }, { status: 400 });
  }
  if (wins + losses > matchesPlayed) {
    return NextResponse.json({ message: '胜场与负场之和不能大于比赛场数。' }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await admin.supabase
    .from('tournament_registrations')
    .update({
      valuation,
      team_name: teamName,
      matches_played: matchesPlayed,
      wins,
      losses,
      kills,
      deaths,
      assists,
      placement,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error || !data) return NextResponse.json({ message: updateErrorMessage(error?.message) }, { status: 400 });
  return NextResponse.json({ ok: true });
}
