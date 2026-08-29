"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

// Returns false during server rendering (and on the client's very first
// render, before hydration) and true afterwards — the standard
// hydration-safe way to detect "JavaScript is actually running here"
// without calling setState from inside an effect.
function useJsReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * Wraps the page's real, server-rendered content and layers the cinematic
 * "Enter the World" / "Skip intro" gateway on top of it as a progressive
 * enhancement.
 *
 * `children` is passed in from the server component (`app/page.tsx`) and is
 * never conditionally withheld — it is always present in the HTML the server
 * sends, so search engines and visitors without JavaScript can read the real
 * homepage content. What this component controls is purely presentational:
 * whether the intro overlay is currently covering that content.
 *
 * - No JavaScript: `jsReady` never becomes true, so the content is never
 *   marked inert/aria-hidden — it stays fully reachable. The `<noscript>`
 *   style below also drops the overlay out of fixed positioning so it lays
 *   out inline at the top of the page instead of pinning over everything,
 *   letting a no-JS visitor simply scroll past it.
 * - JavaScript enabled: on mount, `jsReady` flips true and the overlay
 *   behaves as a proper modal gate (background content marked inert so
 *   keyboard/screen-reader users can't reach it until dismissed; focus moves
 *   into the real content the moment the overlay is dismissed).
 */
export default function GatewayShell({ children }: { children: ReactNode }) {
  const [dismissed, setDismissed] = useState(false);
  const jsReady = useJsReady();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jsReady) return;
    document.body.style.overflow = dismissed ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [jsReady, dismissed]);

  function dismiss() {
    setDismissed(true);
    // Hand focus to the real content for keyboard users once the overlay
    // that was covering it disappears.
    requestAnimationFrame(() => {
      contentRef.current?.focus();
    });
  }

  const gateActive = jsReady && !dismissed;

  return (
    <>
      {!dismissed && (
        <main className="gateway" role="dialog" aria-modal="true" aria-label="The Last Great Pharaoh — intro">
          <noscript>
            {/* Base CSS pins .gateway as a fixed full-viewport overlay so it
                can sit on top of the real content while JS is driving the
                dismiss interaction. Without JS that interaction never
                happens, so drop it back into normal document flow — a
                visitor can simply scroll past this one-screen intro to
                reach the real page underneath. */}
            <style>{".gateway{position:relative!important}"}</style>
          </noscript>
          <div className="gateway-grain" aria-hidden="true" />
          <div className="gateway-content">
            <p className="eyebrow">A historical epic by B. C. Arsenios</p>
            <h1>The Last<br /><em>Great Pharaoh</em></h1>
            <button className="enter-button" onClick={dismiss}>Enter the World</button>
            <button className="skip-button" onClick={dismiss}>Skip intro</button>
          </div>
        </main>
      )}
      <div ref={contentRef} tabIndex={-1} aria-hidden={gateActive || undefined} inert={gateActive || undefined}>
        {children}
      </div>
    </>
  );
}
