/**
 * Meta Pixel loader — gated on stored advertising consent (see
 * app/lib/consent.ts). Same "never load until granted" approach as
 * app/lib/gtag.ts, using Meta's own consent API (fbq('consent', ...))
 * rather than Google's Consent Mode, since that's what the Pixel supports.
 *
 * Dataset ID was provisioned in Phase 1 (Meta Business Portfolio setup) —
 * see TLGP_DECISIONS_LOG. No Conversions API is wired up; if one is added
 * later it must be gated the same way (advertising consent only).
 *
 * Once advertising consent is granted, the site sends Meta's standard
 * PageView event for each route visit, ViewContent on /join, and Lead on
 * /join/confirmed. The initial form submission and /join/success never
 * count as a Lead. We do not use the Conversions API or enhanced
 * conversions (hashed-PII matching).
 */

export const META_PIXEL_ID = "1541395820600997";

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbqFn;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

let pixelLoading = false;
let pixelLoaded = false;

function ensureFbqStub(): void {
  if (typeof window === "undefined" || window.fbq) return;
  // Explicit type annotation (rather than a self-named function expression)
  // so the self-reference to `fbq` inside the closure below resolves to the
  // full FbqFn type instead of the plain function-expression type TS would
  // otherwise infer before the cast completes.
  const fbq: FbqFn = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  }) as FbqFn;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
}

function loadScript(): void {
  if (pixelLoaded || pixelLoading || typeof document === "undefined") return;
  pixelLoading = true;
  const script = document.createElement("script");
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.async = true;
  script.onload = () => {
    pixelLoaded = true;
  };
  document.head.appendChild(script);
}

/**
 * Call whenever the visitor's stored advertising-consent choice is known
 * or changes (see ConsentManager). Loads and initializes the Pixel the
 * first time advertising consent is granted — never before — and revokes
 * consent on the already-loaded Pixel if advertising is later withdrawn.
 */
export function syncMetaConsent(advertisingGranted: boolean): void {
  if (typeof window === "undefined") return;

  if (!advertisingGranted) {
    if (window.fbq) {
      window.fbq("consent", "revoke");
    }
    return;
  }

  const firstLoad = !pixelLoaded && !pixelLoading;
  ensureFbqStub();

  if (firstLoad) {
    window.fbq!("consent", "grant");
    window.fbq!("init", META_PIXEL_ID);
    loadScript();
  } else {
    window.fbq!("consent", "grant");
  }
}

/**
 * Fires Meta's standard page-view event. Route-level de-duplication lives
 * in MetaRouteTracker so a real navigation can be counted while React
 * Strict Mode remounts cannot produce a duplicate for the same visit.
 */
export function fireMetaPageView(advertisingGranted: boolean): boolean {
  if (typeof window === "undefined" || !advertisingGranted || !window.fbq) return false;
  window.fbq("track", "PageView");
  return true;
}

/** Fires only for a consented visit to /join (see MetaRouteTracker). */
export function fireMetaViewContent(advertisingGranted: boolean): boolean {
  if (typeof window === "undefined" || !advertisingGranted || !window.fbq) return false;
  window.fbq("track", "ViewContent", {
    content_name: "Reader List Signup",
    content_category: "Email Signup",
  });
  return true;
}

/**
 * Fires the site's Meta conversion: a confirmed signup, from
 * app/join/confirmed. Uses Meta's standard 'Lead' event (not a custom
 * event) with a content_name identifying it as the confirmed signup, so
 * it's recognized by Meta's own conversion tooling without inventing a
 * custom event name. No-op unless advertising consent is granted at call
 * time.
 */
export function fireMetaLead(advertisingGranted: boolean): void {
  if (typeof window === "undefined" || !advertisingGranted || !window.fbq) return;
  window.fbq("track", "Lead", { content_name: "Confirmed Signup" });
}
