import { DEFAULT_TOURNAMENT_TIMEZONE } from '@/lib/timezone';

export function formatDateTime(value: string, timeZone = DEFAULT_TOURNAMENT_TIMEZONE, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    ...options,
  }).format(new Date(value));
}

export function formatDateRange(start: string, end: string, timeZone = DEFAULT_TOURNAMENT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', timeZone });
  return `${formatter.format(new Date(start))} — ${formatter.format(new Date(end))}`;
}
