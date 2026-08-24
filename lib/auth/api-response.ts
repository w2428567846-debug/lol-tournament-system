import { NextResponse } from 'next/server';

export type AuthGuardError = 'SUPABASE_NOT_CONFIGURED' | 'AUTH_UNAVAILABLE' | 'AUTH_REQUIRED' | 'ACCOUNT_REQUIRED' | 'ADMIN_REQUIRED';

export function authGuardErrorResponse(error: AuthGuardError | undefined, authRequiredMessage = '请先登录。') {
  if (!error || error === 'SUPABASE_NOT_CONFIGURED' || error === 'AUTH_UNAVAILABLE') {
    return NextResponse.json({ message: '身份服务暂时不可用，请稍后重试。' }, { status: 503 });
  }

  if (error === 'ACCOUNT_REQUIRED') {
    return NextResponse.json({ message: '账户尚未就绪，请退出后重新登录或联系管理员。' }, { status: 409 });
  }

  if (error === 'ADMIN_REQUIRED') {
    return NextResponse.json({ message: '管理员权限不足。' }, { status: 403 });
  }

  return NextResponse.json({ message: authRequiredMessage }, { status: 401 });
}
