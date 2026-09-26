"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
} from "../../lib/consent";
import { fireGoogleAdsConversion } from "../../lib/gtag";
import { fireMetaLead } from "../../lib/metaPixel";
import {
  consumeSignupConversion,
  getPendingSignupConversion,
} from "../../lib/signupConversion";

// Tracks the browser-history visit rather than just the pathname. That
// prevents React Strict Mode's development-only mount/remount cycle from
// reporting one signup twice, while still allowing a genuinely separate
// signup made later in the same browser tab to be measured.
let trackedSignupVisitKey: string | null = null;

/**
 * Reports a conversion only when Kit says this address was newly added to
 * the reader-list form. Existing subscribers still reach the success page,
 * but never create another Lead or Google Ads conversion.
 */
export default function SuccessfulSignupTracker({
  isNewSubscriber,
}: {
  isNewSubscriber: boolean;
}) {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );
  const firedRef = useRef(false);

  useEffect(() => {
    const advertising = consent?.advertising ?? false;
    const visitKey =
      typeof window === "undefined"
        ? null
        : `${window.performance.timeOrigin}:${window.history.length}:${window.location.pathname}${window.location.search}`;
    const conversionId = getPendingSignupConversion();
    if (
      !isNewSubscriber ||
      !advertising ||
      !conversionId ||
      !visitKey ||
      firedRef.current ||
      trackedSignupVisitKey === visitKey
    ) {
      return;
    }

    const trackingReady =
      typeof window !== "undefined" &&
      typeof window.gtag === "function" &&
      typeof window.fbq === "function";
    if (!trackingReady) return;

    firedRef.current = true;
    trackedSignupVisitKey = visitKey;
    consumeSignupConversion(conversionId!);
    fireGoogleAdsConversion(true);
    fireMetaLead(true);
  }, [consent, isNewSubscriber]);

  return null;
}
