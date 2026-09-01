"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
  writeConsent,
  type ConsentChoice,
} from "../lib/consent";
import { syncGoogleConsent } from "../lib/gtag";
import { syncMetaConsent } from "../lib/metaPixel";

// Returns false during server rendering and on the client's very first
// render (before hydration), true afterwards — the same hydration-safe way
// GatewayShell detects "JavaScript is actually running here", reused here
// so a visitor without JavaScript never sees a banner they have no way to
// act on. The rest of the site is already fully usable without JavaScript.
function useJsReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * Site-wide cookie-consent control. Rendered once in the root layout so it
 * appears on every page.
 *
 * - First visit (no stored choice): a banner across the bottom of the page
 *   offers Accept all / Reject non-essential / Customize, each one click.
 * - Returning visit (a choice is stored): the banner is replaced by a small
 *   persistent "Privacy Settings" button in the corner, so the choice can
 *   be changed at any time without hunting for it.
 * - Customize (from either entry point) opens a dialog with essential
 *   (always on, no toggle), analytics, and advertising toggles, set and
 *   saved independently of one another.
 *
 * Analytics and advertising both default to off — see app/lib/consent.ts.
 * GA4 and Google Ads (app/lib/gtag.ts) and the Meta Pixel
 * (app/lib/metaPixel.ts) both read the stored choice via the effect below,
 * which runs on mount (so a returning visitor's earlier choice is applied
 * immediately) and again every time the choice changes (accept/reject/
 * customize, or a later change via Privacy Settings) — including
 * withdrawal, which is sent on as a live consent update rather than
 * requiring a page reload.
 *
 * Sits at a lower z-index than the homepage's intro overlay (GatewayShell,
 * z-index 60) so it stays hidden behind that full-screen intro until it's
 * dismissed, rather than competing with it for attention; on pages without
 * the intro it's visible immediately.
 */
export default function ConsentManager() {
  const jsReady = useJsReady();
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentChoice>({ analytics: false, advertising: false });
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    dialogHeadingRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  // Keeps GA4 / Google Ads / Meta Pixel in sync with the stored choice —
  // on first read (mount) and on every subsequent change. Each sync
  // function is itself a no-op until its relevant consent category is
  // granted, so this is safe to call unconditionally.
  useEffect(() => {
    if (!jsReady) return;
    const analytics = consent?.analytics ?? false;
    const advertising = consent?.advertising ?? false;
    syncGoogleConsent(analytics, advertising);
    syncMetaConsent(advertising);
  }, [jsReady, consent]);

  function closeModal() {
    setModalOpen(false);
    openerRef.current?.focus();
  }

  function openCustomize(opener?: HTMLButtonElement | null) {
    openerRef.current = opener ?? null;
    setDraft({
      analytics: consent?.analytics ?? false,
      advertising: consent?.advertising ?? false,
    });
    setModalOpen(true);
  }

  function decide(choice: ConsentChoice) {
    writeConsent(choice);
    setModalOpen(false);
  }

  function acceptAll() {
    decide({ analytics: true, advertising: true });
  }

  function rejectNonEssential() {
    decide({ analytics: false, advertising: false });
  }

  function saveCustom() {
    decide(draft);
  }

  if (!jsReady) return null;

  return (
    <>
      {consent === null && !modalOpen && (
        <div className="consent-banner" role="region" aria-label="Cookie consent">
          <p>
            We use essential cookies to run this site. With your permission, we&apos;d also like to use
            analytics and advertising cookies to understand traffic and measure future campaigns — both
            stay off unless you say yes. See our <a href="/privacy-policy">Privacy Policy</a>.
          </p>
          <div className="consent-actions">
            <button type="button" className="consent-btn" onClick={(e) => openCustomize(e.currentTarget)}>
              Customize
            </button>
            <button type="button" className="consent-btn" onClick={rejectNonEssential}>
              Reject non-essential
            </button>
            <button type="button" className="consent-btn" onClick={acceptAll}>
              Accept all
            </button>
          </div>
        </div>
      )}

      {consent !== null && (
        <button
          type="button"
          className="consent-settings-btn"
          onClick={(e) => openCustomize(e.currentTarget)}
        >
          Privacy Settings
        </button>
      )}

      {modalOpen && (
        <div className="consent-modal-overlay" onClick={closeModal}>
          <div
            className="consent-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-modal-heading"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="consent-modal-close" onClick={closeModal} aria-label="Close">
              ×
            </button>
            <h2 id="consent-modal-heading" tabIndex={-1} ref={dialogHeadingRef}>
              Privacy Settings
            </h2>
            <p>
              Choose which cookies this site can use. These choices take effect immediately — Vercel&apos;s
              cookieless traffic counter (see our <a href="/privacy-policy">Privacy Policy</a>) always
              runs regardless of your choice here; every other tool below stays off unless and until you
              turn it on.
            </p>

            <div className="consent-category">
              <div className="consent-category-head">
                <span>Essential</span>
                <span className="consent-toggle-label">Always on</span>
              </div>
              <p>Required for the site to work, including remembering this choice.</p>
            </div>

            <div className="consent-category">
              <div className="consent-category-head">
                <label htmlFor="consent-analytics">Analytics</label>
                <input
                  id="consent-analytics"
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
                />
              </div>
              <p>
                Lets us run Google Analytics&nbsp;4 to understand which pages readers visit, in aggregate.
                Blocked from running unless this is on.
              </p>
            </div>

            <div className="consent-category">
              <div className="consent-category-head">
                <label htmlFor="consent-advertising">Advertising</label>
                <input
                  id="consent-advertising"
                  type="checkbox"
                  checked={draft.advertising}
                  onChange={(e) => setDraft((d) => ({ ...d, advertising: e.target.checked }))}
                />
              </div>
              <p>
                Lets us run Google Ads conversion tracking and the Meta (Facebook/Instagram) Pixel to
                measure whether a reader-list signup followed one of our ads. Blocked from running unless
                this is on.
              </p>
            </div>

            <div className="consent-modal-actions">
              <button type="button" className="consent-btn" onClick={rejectNonEssential}>
                Reject non-essential
              </button>
              <button type="button" className="consent-btn" onClick={acceptAll}>
                Accept all
              </button>
              <button type="button" className="consent-btn" onClick={saveCustom}>
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
