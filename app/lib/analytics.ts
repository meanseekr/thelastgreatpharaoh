/**
 * Minimal analytics hook.
 *
 * No analytics provider is installed on this site yet (GA4 / GTM are a later
 * phase per the TLGP project plan). This function is the single call site
 * the rest of the app uses to report events, so that wiring up a real
 * provider later means editing this one file instead of hunting through
 * every component.
 *
 * Today it only pushes to window.dataLayer / window.gtag if either happens
 * to exist (harmless no-op otherwise) and logs to the console in
 * development so the event can be verified during testing.
 */

type AnalyticsEvent = "email_signup";

type AnalyticsDetail = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: AnalyticsEvent, detail?: AnalyticsDetail): void {
  if (typeof window === "undefined") return;

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...detail });
  } else if (typeof window.gtag === "function") {
    window.gtag("event", name, detail);
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${name}`, detail);
  }
}
