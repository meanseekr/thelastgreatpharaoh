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
 * conversion tracking has no site-wide 'config' call by design (that would
 * enable remarketing-tag behavior beyond the one conversion this project
 * is scoped to) — see fireGoogleAdsConversion below.
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
    loadScript();
  } else {
    window.gtag!("consent", "update", consentPayload(analytics, advertising));
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
