const RETURN_TO_BASE = 'https://rift-command.invalid';

export function safeReturnTo(value: string | string[] | null | undefined, fallback = '/account') {
  const candidate = typeof value === 'string' ? value : fallback;

  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, RETURN_TO_BASE);
    if (parsed.origin !== RETURN_TO_BASE) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
