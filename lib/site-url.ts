const LOCAL_SITE_ORIGIN = 'http://localhost:3000';

export function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return LOCAL_SITE_ORIGIN;

  try {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol)) return LOCAL_SITE_ORIGIN;
    return url.origin;
  } catch {
    return LOCAL_SITE_ORIGIN;
  }
}
