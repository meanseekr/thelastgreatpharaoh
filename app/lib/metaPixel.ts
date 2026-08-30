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
 * Deliberately does not fire a 'PageView' event on load, does not use the
 * Conversions API, and does not turn on enhanced conversions (hashed-PII
 * matching). The Pixel is initialized (so the one event below has
 * somewhere to report to) but nothing is sent until app/join/confirmed
 * fires the single conversion this project is scoped to measure, using
 * Meta's standard 'Lead' event (not a custom event) so it's recognized by
 * Meta's own conversion tooling. This is narrower than Meta's own standard
 * install guide, which recommends a site-wide PageView plus automatic
 * events — flagged as a PROPOSED follow-up in the decisions log if the
 * author wants broader audience-building later, not enabled here.
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
 * Fires the one Meta event this site counts: a confirmed signup, from
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
