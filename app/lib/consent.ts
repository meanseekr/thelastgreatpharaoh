/**
 * Cookie-consent storage.
 *
 * This is the single source of truth for the visitor's analytics/
 * advertising consent choice, read and written by <ConsentManager>. No
 * analytics or advertising tool reads it yet — GA4, Google Ads conversion
 * tracking, and the Meta Pixel/Conversions API are all a later phase per
 * the TLGP project plan (see the privacy policy's "Cookies, analytics, and
 * advertising" section). Storing the choice now, with analytics and
 * advertising defaulting to off, means those tools can simply check this
 * file when they're installed later instead of every visitor being asked
 * again.
 *
 * The record itself never contains personal data — just three booleans, a
 * timestamp, and a schema version, held in a single first-party cookie.
 *
 * Exposed as a tiny external store (subscribe/getSnapshot/getServerSnapshot)
 * so <ConsentManager> can read it via useSyncExternalStore — the same
 * hydration-safe, no-setState-in-effect pattern GatewayShell already uses
 * for "is JavaScript actually running yet".
 */

export const CONSENT_COOKIE_NAME = "tlgp_consent";
const CONSENT_COOKIE_MAX_AGE_DAYS = 180;
const CONSENT_VERSION = 1;

export type ConsentChoice = {
  analytics: boolean;
  advertising: boolean;
};

export type ConsentRecord = ConsentChoice & {
  essential: true;
  decidedAt: string;
  version: number;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === "undefined") return;
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function parseConsentCookie(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.advertising !== "boolean") {
      return null;
    }
    return {
      essential: true,
      analytics: parsed.analytics,
      advertising: parsed.advertising,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

// Cached snapshot so getConsentSnapshot() returns a referentially stable
// value between writes, as useSyncExternalStore requires — it only changes
// (a new object) when writeConsent() actually runs.
let cachedSnapshot: ConsentRecord | null | undefined;
const listeners = new Set<() => void>();

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Client snapshot: the visitor's stored choice, or null if they haven't decided yet. */
export function getConsentSnapshot(): ConsentRecord | null {
  if (cachedSnapshot === undefined) {
    cachedSnapshot = parseConsentCookie(readCookie(CONSENT_COOKIE_NAME));
  }
  return cachedSnapshot;
}

/** Server/pre-hydration snapshot: always "no decision yet" — cookies aren't read on the server. */
export function getConsentServerSnapshot(): ConsentRecord | null {
  return null;
}

/** Records the visitor's choice, updates the cached snapshot, and notifies subscribers. */
export function writeConsent(choice: ConsentChoice): ConsentRecord {
  const record: ConsentRecord = {
    essential: true,
    analytics: choice.analytics,
    advertising: choice.advertising,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  writeCookie(CONSENT_COOKIE_NAME, JSON.stringify(record), CONSENT_COOKIE_MAX_AGE_DAYS);
  cachedSnapshot = record;
  listeners.forEach((listener) => listener());
  return record;
}
