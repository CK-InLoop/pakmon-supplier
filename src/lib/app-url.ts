function withProtocol(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function getAppUrl() {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (process.env.VERCEL && vercelUrl) return withProtocol(vercelUrl).replace(/\/$/, '');

  const configuredUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  return withProtocol(configuredUrl || 'http://localhost:3000').replace(/\/$/, '');
}

export function applyProductionAuthUrl() {
  if (!process.env.VERCEL) return;
  const url = getAppUrl();
  process.env.AUTH_URL = url;
  process.env.NEXTAUTH_URL = url;
}
