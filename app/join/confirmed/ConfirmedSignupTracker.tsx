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
 */
export default function ConfirmedSignupTracker() {
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  const firedRef = useRef(false);

  useEffect(() => {
    const advertising = consent?.advertising ?? false;
    if (!advertising || firedRef.current) return;
    firedRef.current = true;
    fireGoogleAdsConversion(true);
    fireMetaLead(true);
  }, [consent]);

  return null;
}
