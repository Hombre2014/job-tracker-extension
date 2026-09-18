// Shared logic for recognizing a browser tab as "the Job Tracker frontend",
// used by both the background service worker (Quick Save tab reuse /
// navigation) and the popup (auth token sync).
//
// Matches are done on the parsed URL's hostname/port/path rather than a raw
// string.includes() check, so a URL like
// "https://evil.example/?x=online-job-trackr.vercel.app" or
// "https://online-job-trackr.vercel.app.evil.example" can't be mistaken for
// the real frontend.

const PRODUCTION_HOSTNAME = 'online-job-trackr.vercel.app';
// URL.hostname serializes an IPv6 address with brackets included, e.g.
// "[::1]" - not just "::1".
const DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);
// job-tracker-frontend is Next.js, run via `next dev`/`dev:3001` - only
// ever on 3000 or 3001, never Vite/5173 (that port belongs to this
// extension's own dev server, not the frontend).
const DEV_PORTS = new Set(['3000', '3001']);
// Every real Job Tracker page lives under this path prefix (e.g.
// /home/boards/<id>/board). Hostname+port alone is not a safe signal for
// dev tabs: ports 3000/3001 are extremely common defaults, so anyone
// running an unrelated local project on one of them would have that
// project's tab mistaken for the Job Tracker frontend. Requiring this path
// prefix rules that out with a signal an unrelated app essentially never
// happens to share.
const APP_PATH_PREFIX = '/home';

function parseUrl(url: string | undefined): URL | null {
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isAppPath(pathname: string): boolean {
  return pathname === APP_PATH_PREFIX || pathname.startsWith(`${APP_PATH_PREFIX}/`);
}

export function isProductionFrontendUrl(url: string | undefined): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  // Require the canonical origin: https on the default port. `URL.port` is
  // '' for the protocol's default port (443 for https), so this rejects
  // both a plain-http tab and an explicit non-standard port.
  return (
    parsed.hostname === PRODUCTION_HOSTNAME &&
    parsed.protocol === 'https:' &&
    parsed.port === '' &&
    isAppPath(parsed.pathname)
  );
}

export function isDevFrontendUrl(url: string | undefined): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  return (
    DEV_HOSTNAMES.has(parsed.hostname) &&
    DEV_PORTS.has(parsed.port) &&
    isAppPath(parsed.pathname)
  );
}

// `allowDev` should be `import.meta.env.DEV` from the calling entry point,
// so a production build never treats a local dev-server tab as the
// frontend, even if one happens to be open.
export function isFrontendTabUrl(
  url: string | undefined,
  allowDev: boolean,
): boolean {
  return isProductionFrontendUrl(url) || (allowDev && isDevFrontendUrl(url));
}
