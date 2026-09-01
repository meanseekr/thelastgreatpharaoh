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
 * Google Ads destination registration — fifth attempt: the fourth attempt
 * (reordering the first-load path so `config` is queued before
 * loadScript() appends the `<script>` tag) did not fix it either. The
 * real problem was broader than command ordering within a single call:
 * for a *returning* visitor who already has a stored consent choice,
 * that whole sequence was still first queued from ConsentManager's React
 * mount effect — which runs after the page has already begun mounting —
 * while the isolated same-origin iframe that successfully fired
 * conversions ran the identical sequence synchronously, before anything
 * else. This version moves the first-load sequence for a *returning*
 * visitor out of React entirely: buildConsentBootstrapScript() below
 * generates a small, dependency-free inline script that app/layout.tsx
 * runs via next/script's `beforeInteractive` strategy — injected into the
 * initial HTML and executed before React hydrates, let alone before any
 * effect. It reads the stored `tlgp_consent` cookie directly; if a prior
 * choice granted analytics or advertising, it queues `consent default`,
 * `js`, and the necessary `config` call(s) and *then* appends the gtag.js
 * `<script>` tag — all before hydration. It records what it did on
 * `window.__tlgpConsentBootstrap`, and syncGoogleConsent below adopts
 * that state (via adoptBootstrapState) the first time it runs, so
 * ConsentManager's still-unchanged mount effect never re-sends, duplicates,
 * or overwrites what the bootstrap already established — it only sends
 * something when the consent state has actually changed since (a
 * brand-new grant, an upgrade, or a withdrawal). A visitor with no stored
 * choice yet, or one who grants consent for the first time by clicking
 * Accept/Customize, is unaffected by the bootstrap (it does nothing
 * without a stored cookie) and goes through the same React-driven
 * first-load path as before.
 */

import { CONSENT_COOKIE_NAME } from "./consent";

export const GA4_MEASUREMENT_ID = "G-XWHSC4BH6S";
export const GOOGLE_ADS_CONVERSION_ID = "AW-18245662140";
const GOOGLE_ADS_CONVERSION_LABEL = "jmQ6CPGquOocELzrmvxD";
const GOOGLE_ADS_SEND_TO = `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __tlgpConsentBootstrap?: {
      analytics: boolean;
      advertising: boolean;
      scriptId: string;
    };
  }
}

let scriptLoading = false;
let scriptLoaded = false;
let adsDestinationConfigured = false;
let analyticsConfigured = false;
let bootstrapAdopted = false;
let lastSynced: { analytics: boolean; advertising: boolean } | null = null;

/**
 * Source for the document-level bootstrap script that app/layout.tsx runs
 * via next/script's `beforeInteractive` strategy, before React hydrates —
 * see the file-level comment for why. Deliberately plain, dependency-free
 * JS text (not TypeScript, not part of the React bundle): it has to stand
 * on its own as literal inline script content. Mirrors the first-load
 * logic in syncGoogleConsent below, but reads the stored consent cookie
 * directly instead of going through React state. Does nothing if there's
 * no stored choice yet, or if the stored choice granted neither category —
 * the same "never load until consent" rule as everywhere else in this
 * file. Configures the Ads ID with `send_page_view: false` only — no
 * remarketing config is added.
 */
export function buildConsentBootstrapScript(): string {
  return `(function () {
  try {
    var match = document.cookie.match(/(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)/);
    if (!match) return;
    var parsed = JSON.parse(decodeURIComponent(match[1]));
    var analytics = !!(parsed && parsed.analytics === true);
    var advertising = !!(parsed && parsed.advertising === true);
    if (!analytics && !advertising) return;

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () { window.dataLayer.push(arguments); };
    }

    window.gtag('consent', 'default', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: advertising ? 'granted' : 'denied',
      ad_user_data: advertising ? 'granted' : 'denied',
      ad_personalization: advertising ? 'granted' : 'denied'
    });
    window.gtag('js', new Date());

    var scriptId = advertising ? '${GOOGLE_ADS_CONVERSION_ID}' : '${GA4_MEASUREMENT_ID}';
    if (advertising) {
      window.gtag('config', '${GOOGLE_ADS_CONVERSION_ID}', { send_page_view: false });
    }
    if (analytics) {
      window.gtag('config', '${GA4_MEASUREMENT_ID}');
    }

    window.__tlgpConsentBootstrap = { analytics: analytics, advertising: advertising, scriptId: scriptId };

    var s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + scriptId;
    s.async = true;
    document.head.appendChild(s);
  } catch (e) {
    // Malformed cookie or anything unexpected: fail silently and leave
    // gtag.js to load normally (if at all) via ConsentManager's effect.
  }
})();`;
}

/**
 * Folds in whatever the document-level bootstrap script already did (see
 * buildConsentBootstrapScript above) — reads `window.__tlgpConsentBootstrap`
 * exactly once per page load and updates this module's own state to
 * match, so syncGoogleConsent never re-sends `consent default`/`js`,
 * never appends a second `<script>` tag, and never re-issues a `config`
 * call the bootstrap already made. A no-op if the bootstrap never ran
 * (no stored consent choice existed at page load).
 */
function adoptBootstrapState(): void {
  if (bootstrapAdopted || typeof window === "undefined") return;
  bootstrapAdopted = true;
  const bootstrap = window.__tlgpConsentBootstrap;
  if (!bootstrap) return;
  scriptLoading = true;
  if (bootstrap.advertising) adsDestinationConfigured = true;
  if (bootstrap.analytics) analyticsConfigured = true;
  lastSynced = { analytics: bootstrap.analytics, advertising: bootstrap.advertising };
}

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
 * Registers the Ads destination for the case where Advertising consent
 * arrives *after* the script has already been bootstrapped with the GA4
 * ID (e.g. the visitor granted Analytics only, then later upgraded via
 * Privacy Settings, without a page reload — or the document-level
 * bootstrap already configured GA4 only, and Advertising is granted for
 * the first time in this page view). There's no way to change which ID a
 * `<script>` tag was loaded with after the fact, so this issues a
 * `config` call for the Ads ID on the existing gtag.js runtime — the same
 * `config` mechanism used on the first-load path (React-driven or
 * bootstrap-driven) — which is what actually registers a destination for
 * event routing. Guarded by `adsDestinationConfigured` so it only ever
 * runs once per page view, whether that flag was set here, by the
 * first-load path below, or adopted from the bootstrap.
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
 * The first thing this does is adoptBootstrapState(): if the document-
 * level bootstrap script (see the file-level comment) already handled
 * this exact consent state before React even hydrated, this call is a
 * no-op — nothing is re-sent, duplicated, or overwritten. It only
 * actually does anything when the state has changed since (a brand-new
 * grant with no bootstrap involved, an upgrade from what the bootstrap
 * established, or a withdrawal).
 *
 * When it does run, which ID the script is bootstrapped with depends on
 * what's granted at that first load: Advertising present → bootstrap
 * with the Google Ads ID, then explicitly `config` it (the `config` call
 * is what actually registers it as a routable destination — see the
 * file-level comment; the script `id=` alone does not), then also
 * `config` GA4 if Analytics is granted too. Advertising absent, Analytics
 * present → bootstrap with the GA4 ID only; Google Ads is never loaded or
 * configured. Only one `<script>` tag is ever added, by loadScript's own
 * load/loading guard.
 */
export function syncGoogleConsent(analytics: boolean, advertising: boolean): void {
  if (typeof window === "undefined") return;
  adoptBootstrapState();

  if (!analytics && !advertising) {
    // Nothing granted (denied, or withdrawn back to nothing): if the tag
    // was already loaded from an earlier grant (React-driven or
    // bootstrap-driven), tell it to stop rather than leaving stale
    // "granted" signals in place. If it was never loaded, there is
    // nothing to do — it stays that way.
    if (scriptLoaded || scriptLoading) {
      ensureGtagStub();
      window.gtag!("consent", "update", consentPayload(false, false));
    }
    lastSynced = { analytics: false, advertising: false };
    return;
  }

  if (lastSynced && lastSynced.analytics === analytics && lastSynced.advertising === advertising) {
    // Already in this exact state — either the bootstrap script just
    // established it, or an earlier call to this function already did.
    // Nothing to send.
    return;
  }

  const firstLoad = !scriptLoaded && !scriptLoading;
  ensureGtagStub();

  if (firstLoad) {
    window.gtag!("consent", "default", consentPayload(analytics, advertising));
    window.gtag!("js", new Date());
    if (advertising) {
      window.gtag!("config", GOOGLE_ADS_CONVERSION_ID, { send_page_view: false });
      adsDestinationConfigured = true;
      loadScript(GOOGLE_ADS_CONVERSION_ID);
    } else {
      loadScript(GA4_MEASUREMENT_ID);
    }
  } else {
    window.gtag!("consent", "update", consentPayload(analytics, advertising));
    // Advertising consent arriving after the script was already
    // bootstrapped (React-driven or bootstrap-driven) with the GA4 ID.
    ensureAdsDestinationConfigured(advertising);
  }

  if (analytics && !analyticsConfigured) {
    window.gtag!("config", GA4_MEASUREMENT_ID);
    analyticsConfigured = true;
  }

  lastSynced = { analytics, advertising };
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
