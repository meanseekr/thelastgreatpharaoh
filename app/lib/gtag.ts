/**
 * Google tag (gtag.js) loader — GA4 + Google Ads conversion tracking,
 * gated on stored visitor consent (see app/lib/consent.ts).
 *
 * This uses "Basic" Google Consent Mode v2, not "Advanced": gtag.js is
 * never added to the page at all until the visitor has granted at least
 * one of analytics or advertising consent. That's a deliberate, more
 * conservative choice than Google's own advanced-mode snippet (which loads
 * the tag on every page load with consent defaulted to "denied" for
 * statistical modeling) — it keeps the "zero Google requests until
 * consent" behavior already verified in production after Phase 2, and
 * keeps the five required consent states easy to verify directly from the
 * network panel: denied → no request at all; analytics-only → the tag
 * loads and GA4 is configured, Google Ads is not; advertising-only → the
 * tag loads for Google Ads only, no GA4 config call; accept-all → both;
 * changed/withdrawn → a live 'consent update' call turns future collection
 * off without a page reload.
 *
 * GA4 measurement ID and Google Ads conversion ID/label were provisioned
 * in Phase 1 / this Phase-3 setup — see TLGP_DECISIONS_LOG. No campaign
 * was created and no billing was entered to obtain either.
 *
 * Google Ads destination registration — second attempt: gtag.js only
 * routes an `event`/`send_to` call to a destination it has actually been
 * told about — via the script's own `id=` query param, or a `config` call
 * for that ID. The first attempt at this fix (registering the Ads ID via
 * a `config` call queued right after the bootstrap `js` call) was verified
 * on the real, live gtag.js — correct command order, correct consent
 * gating — and still never produced a single outbound request, in this
 * session's own testing tool *and* in a clean, extension-free Incognito
 * Chrome window. So this file now bootstraps the script itself with
 * whichever ID actually needs to route events on this page load, instead
 * of relying on a later `config` call for a second destination: when
 * Advertising consent is present at first load, the script's own `id=` is
 * `AW-18245662140` (Google Ads), and GA4 is added afterward with a plain
 * `config` call if Analytics is also granted. When only Analytics is
 * granted, the script bootstraps with the GA4 ID exactly as before, and
 * Google Ads is never touched. Only one `<script>` tag is ever added
 * (see loadScript below) — whichever ID it's loaded with is the one
 * that's actually registered as a destination for this page load.
 */

export const GA4_MEASUREMENT_ID = "G-XWHSC4BH6S";
export const GOOGLE_ADS_CONVERSION_ID = "AW-18245662140";
const GOOGLE_ADS_CONVERSION_LABEL = "jmQ6CPGquOocELzrmvxD";
const GOOGLE_ADS_SEND_TO = `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let scriptLoading = false;
let scriptLoaded = false;
let adsDestinationConfigured = false;

function ensureGtagStub(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
}

function consentPayload(analytics: boolean, advertising: boolean) {
  return {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: advertising ? "granted" : "denied",
    ad_user_data: advertising ? "granted" : "denied",
    ad_personalization: advertising ? "granted" : "denied",
  } as const;
}

/**
 * Best-effort registration for the case Google's own `config` mechanism
 * was meant to cover: Advertising consent arriving *after* the script has
 * already been bootstrapped with the GA4 ID (e.g. the visitor granted
 * Analytics only, then later upgraded via Privacy Settings, without a page
 * reload). There's no way to change which ID a `<script>` tag was loaded
 * with after the fact, so this is still a `config` call for the Ads ID —
 * the same mechanism that was verified not to produce a live conversion
 * request when tested standalone. It's kept here because it's harmless
 * (a single extra `config` call, gated and deduped) and it's the only
 * option left for this specific after-the-fact scenario, but it carries
 * the same caveat: it may not actually route a conversion event. The
 * page-load-time fix below (bootstrapping with the Ads ID directly) is
 * the one that's been verified to work.
 */
function ensureAdsDestinationConfigured(advertising: boolean): void {
  if (!advertising || adsDestinationConfigured || typeof window === "undefined") return;
  window.gtag!("config", GOOGLE_ADS_CONVERSION_ID, { send_page_view: false });
  adsDestinationConfigured = true;
}

/** Adds the gtag.js `<script>` tag exactly once, bootstrapped with `id`. */
function loadScript(id: string): void {
  if (scriptLoaded || scriptLoading || typeof document === "undefined") return;
  scriptLoading = true;
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.async = true;
  script.onload = () => {
    scriptLoaded = true;
  };
  document.head.appendChild(script);
}

/**
 * Call whenever the visitor's stored consent choice is known or changes
 * (see ConsentManager). Loads gtag.js the first time either analytics or
 * advertising is granted — never before.
 *
 * Which ID the script is bootstrapped with depends on what's granted at
 * that first load: Advertising present → bootstrap with the Google Ads ID
 * (this is what actually registers it as a routable destination — see the
 * file-level comment), then also `config` GA4 if Analytics is granted too.
 * Advertising absent, Analytics present → bootstrap with the GA4 ID only,
 * exactly as before; Google Ads is never loaded or configured. Only one
 * `<script>` tag is ever added, by loadScript's own load/loading guard.
 */
export function syncGoogleConsent(analytics: boolean, advertising: boolean): void {
  if (typeof window === "undefined") return;

  if (!analytics && !advertising) {
    // Nothing granted (denied, or withdrawn back to nothing): if the tag
    // was already loaded from an earlier grant, tell it to stop rather
    // than leaving stale "granted" signals in place. If it was never
    // loaded, there is nothing to do — it stays that way.
    if (scriptLoaded || scriptLoading) {
      ensureGtagStub();
      window.gtag!("consent", "update", consentPayload(false, false));
    }
    return;
  }

  const firstLoad = !scriptLoaded && !scriptLoading;
  ensureGtagStub();

  if (firstLoad) {
    window.gtag!("consent", "default", consentPayload(analytics, advertising));
    window.gtag!("js", new Date());
    if (advertising) {
      // Bootstrap with the Ads ID itself — this is the registration.
      // (GA4, if also granted, is added below via the shared `config`
      // call at the bottom of this function.)
      adsDestinationConfigured = true;
      loadScript(GOOGLE_ADS_CONVERSION_ID);
    } else {
      // Analytics-only: unchanged from before this fix.
      loadScript(GA4_MEASUREMENT_ID);
    }
  } else {
    window.gtag!("consent", "update", consentPayload(analytics, advertising));
    // Advertising consent arriving after the script already bootstrapped
    // with the GA4 ID — see ensureAdsDestinationConfigured's own comment
    // for why this is a best-effort fallback, not a verified fix.
    ensureAdsDestinationConfigured(advertising);
  }

  if (analytics) {
    window.gtag!("config", GA4_MEASUREMENT_ID);
  }
}

/**
 * Fires the one and only Google Ads conversion this site counts: a
 * confirmed signup, from app/join/confirmed. No-op unless advertising
 * consent is granted at call time.
 */
export function fireGoogleAdsConversion(advertisingGranted: boolean): void {
  if (typeof window === "undefined" || !advertisingGranted || !window.gtag) return;
  window.gtag("event", "conversion", { send_to: GOOGLE_ADS_SEND_TO });
}
