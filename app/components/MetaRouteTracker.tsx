"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
} from "../lib/consent";
import {
  fireMetaPageView,
  fireMetaViewContent,
  syncMetaConsent,
} from "../lib/metaPixel";

// Module-level visit state survives React Strict Mode's development-only
// remount, but resets on a full browser load. Moving to a different route
// starts a new visit; returning to a route later can therefore be counted.
let observedPathname: string | null = null;
let routeVisit = 0;
let trackedRouteVisit = 0;

/**
 * Sends consent-gated Meta funnel events for client and full-page route
 * visits. PageView fires once on every route. ViewContent accompanies it
 * only on /join. No event is sent before Advertising consent is granted.
 */
export default function MetaRouteTracker() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );

  useEffect(() => {
    if (pathname !== observedPathname) {
      observedPathname = pathname;
      routeVisit += 1;
    }

    const advertising = consent?.advertising ?? false;
    if (!advertising || trackedRouteVisit === routeVisit) return;

    // ConsentManager normally initializes the Pixel first. Calling the
    // idempotent sync here as well makes this tracker safe against effect-
    // ordering changes and guarantees the fbq queue exists before firing.
    syncMetaConsent(true);

    if (!fireMetaPageView(true)) return;
    if (pathname === "/join") {
      fireMetaViewContent(true);
    }

    trackedRouteVisit = routeVisit;
  }, [consent, pathname]);

  return null;
}
