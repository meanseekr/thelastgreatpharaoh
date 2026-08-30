"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getConsentServerSnapshot, getConsentSnapshot, subscribeConsent } from "../../lib/consent";
import { fireGoogleAdsConversion } from "../../lib/gtag";
import { fireMetaLead } from "../../lib/metaPixel";

/**
 * Fires the site's one and only ad-platform conversion — a confirmed
 * signup — when this page (the real end of the double opt-in flow) is
 * viewed with advertising consent already granted. Renders nothing.
 *
 * A visitor who reaches this page without having granted advertising
 * consent yet (e.g. they're deciding via the first-visit banner) doesn't
 * get skipped forever: if they grant advertising consent — including via
 * the persistent Privacy Settings control — while this page is still
 * open, the conversion fires once at that point. It never fires twice for
 * the same page view, and never fires at all without advertising consent.
 *
 * Hardened against a real race found in testing: ConsentManager lazily
 * creates window.gtag/window.fbq (see app/lib/gtag.ts, app/lib/metaPixel.ts)
 * inside its own mount effect. If this component's effect ever ran before
 * that one — which it did prior to the app/layout.tsx fix that now renders
 * <ConsentManager /> before {children} so its effect always runs first —
 * fireGoogleAdsConversion()/fireMetaLead() would silently no-op because
 * window.gtag/window.fbq didn't exist yet, while firedRef was already
 * marked true, permanently losing the conversion for that page view. This
 * component now checks that both are actually present as functions before
 * marking itself fired, so a future ordering regression fails safe
 * (retries on the next consent change) instead of silently dropping the
 * one conversion this project is scoped to measure.
 */
export default function ConfirmedSignupTracker() {
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  const firedRef = useRef(false);

  useEffect(() => {
    const advertising = consent?.advertising ?? false;
    if (!advertising || firedRef.current) return;

    // Only commit to "fired" once the tracking functions are actually
    // callable — see the component doc comment above. If they're not
    // ready yet, leave firedRef false so a later consent change (or a
    // fixed mount order) gets a real retry instead of a silent no-op.
    const trackingReady =
      typeof window !== "undefined" &&
      typeof window.gtag === "function" &&
      typeof window.fbq === "function";
    if (!trackingReady) return;

    firedRef.current = true;
    fireGoogleAdsConversion(true);
    fireMetaLead(true);
  }, [consent]);

  return null;
}
