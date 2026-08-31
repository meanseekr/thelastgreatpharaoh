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
 * Google Ads destination registration: gtag.js only routes an
 * `event`/`send_to` call to a destination it has actually been told
 * about — via the script's own `id=` query param, or a `config` call for
 * that ID. This file's script tag only ever names the GA4 ID, and (by
 * design, see syncGoogleConsent below) never calls `config` for the Ads
 * ID either from a site-wide/every-page path — so, found in live testing,
 * `fireGoogleAdsConversion()`'s event never actually reached Google: it
 * had nowhere to route to. The fix is `ensureAdsDestinationConfigured()`
 * below: exactly one `gtag('config', GOOGLE_ADS_CONVERSION_ID,
 * {send_page_view: false})` call, made only when Advertising consent is
 * granted, queued immediately after the bootstrap `gtag('js', ...)` call
 * (or as soon as Advertising consent arrives, if that's later than first
 * load) and always before `fireGoogleAdsConversion()` can run. This
 * registers the destination — the minimum gtag.js needs to route the one
 * conversion event this project counts — without configuring a site-wide
 * page_view for it, which is what would turn it into a remarketing tag.
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
 * Registers AW-18245662140 as a destination gtag.js actually knows about,
 * exactly once per page load, and only under Advertising consent. Without
 * this, `gtag('event', 'conversion', {send_to: 'AW-.../...'})` has no
 * registered destination to route to and gtag.js silently drops it — see
 * the file-level comment above. `send_page_view: false` registers the
 * destination without also firing the site-wide remarketing pageview tag
 * `config` would otherwise trigger, preserving the "no remarketing tag,
 * just the one conversion" scope this project is limited to.
 */
function ensureAdsDestinationConfigured(advertising: boolean): void {
  if (!advertising || adsDestinationConfigured || typeof window === "undefined") return;
  window.gtag!("config", GOOGLE_ADS_CONVERSION_ID, { send_page_view: false });
  adsDestinationConfigured = true;
}

function loadScript(): void {
  if (scriptLoaded || scriptLoading || typeof document === "undefined") return;
  scriptLoading = true;
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  script.async = true;
  script.onload = () => {
    scriptLoaded = true;
  };
  document.head.appendChild(script);
}

/**
 * Call whenever the visitor's stored consent choice is known or changes
 * (see ConsentManager). Loads gtag.js the first time either analytics or
 * advertising is granted — never before — sets Consent Mode v2 signals to
 * match, and configures GA4 only when analytics is granted. Google Ads
 * gets exactly one `config` call, only under Advertising consent, with
 * `send_page_view: false` — enough for gtag.js to route the one
 * conversion event this project counts (see
 * ensureAdsDestinationConfigured above), but not a site-wide page_view /
 * remarketing tag, which stays deliberately out of scope — see
 * fireGoogleAdsConversion below.
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
    // Register the Google Ads destination immediately after the bootstrap
    // 'js' call and before the script itself loads — i.e. queued in
    // dataLayer in the correct order for gtag.js to process on load —
    // and before loadScript() below, so it's never possible for
    // fireGoogleAdsConversion() to run first. See the file-level comment
    // and ensureAdsDestinationConfigured() above.
    ensureAdsDestinationConfigured(advertising);
    loadScript();
  } else {
    window.gtag!("consent", "update", consentPayload(analytics, advertising));
    // Advertising consent may have been granted after first load (e.g. the
    // visitor granted Analytics only, then later upgraded via Privacy
    // Settings) — register the destination now if so. No-ops if already
    // registered or still not granted.
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
