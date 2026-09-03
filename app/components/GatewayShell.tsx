"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type TransitionEvent as ReactTransitionEvent,
} from "react";

const INTRO_SEEN_KEY = "tlgp-intro-seen";

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

function readIntroSeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    // sessionStorage can throw in private/locked-down browsing contexts.
    // Treating that as "not seen yet" just means the intro can replay —
    // a safe degrade, never a broken page.
    return false;
  }
}

function writeIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // See readIntroSeen — failing to persist the flag just means this
    // browser session may see the intro again; it never blocks dismissal.
  }
}

// Same hydration-safe technique as useJsReady, applied to "has this browser
// session already seen the intro": false during SSR and the client's first
// paint (matching the server-rendered HTML so there's no hydration
// mismatch), then the real sessionStorage value once mounted.
function useIntroAlreadySeen() {
  return useSyncExternalStore(
    () => () => {},
    readIntroSeen,
    () => false
  );
}

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

type Phase = "entry" | "playing" | "ending" | "error";

/**
 * Wraps the page's real, server-rendered content and layers the cinematic
 * video introduction on top of it as a progressive enhancement.
 *
 * `children` is passed in from the server component (`app/page.tsx`) and is
 * never conditionally withheld — it is always present in the HTML the server
 * sends, so search engines and visitors without JavaScript can read the real
 * homepage content. What this component controls is purely presentational:
 * whether the intro overlay is currently covering that content.
 *
 * - No JavaScript: the overlay stays in its "entry" phase forever (there is
 *   no click handler to advance it without JS) and the `<noscript>` style
 *   below drops it out of fixed positioning so it lays out inline at the top
 *   of the page instead of pinning over everything — a no-JS visitor simply
 *   scrolls past it to reach the real page underneath, exactly as before.
 * - JavaScript enabled, first visit this browser session: a full-screen
 *   black gate offers PLAY INTRO / SKIP INTRO. Playing starts the video from
 *   the beginning with sound (the browser allows this because it's a direct
 *   result of the click, not autoplay) and runs it to completion, then fades
 *   the whole overlay to the homepage. Skipping — the button, or Escape —
 *   reveals the homepage immediately, no fade. Either path writes
 *   sessionStorage, so returning to the homepage later in the same session
 *   (useIntroAlreadySeen) goes straight to the regular page: the gate is
 *   never rendered at all, not even briefly.
 * - Playback failure (network error, decode error, or a rejected play()
 *   promise) drops back to the entry screen with an inline note and turns
 *   "Play Intro" into "Try Again", alongside the ever-present Skip Intro.
 */
export default function GatewayShell({ children }: { children: ReactNode }) {
  const jsReady = useJsReady();
  const alreadySeen = useIntroAlreadySeen();
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<Phase>("entry");
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const endingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The gate is on screen only for a first-visit-this-session user who
  // hasn't dismissed it yet. Once either flips, it disappears — and, since
  // alreadySeen is read from sessionStorage before this ever mounts on a
  // later homepage visit, it disappears without ever having been shown.
  const gateVisible = !dismissed && !alreadySeen;
  const gateActive = jsReady && gateVisible;

  useEffect(() => {
    if (!jsReady) return;
    document.body.style.overflow = gateVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [jsReady, gateVisible]);

  useEffect(() => {
    if (!gateVisible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateVisible]);

  useEffect(() => {
    return () => {
      if (endingTimeoutRef.current) clearTimeout(endingTimeoutRef.current);
    };
  }, []);

  function dismiss() {
    writeIntroSeen();
    setDismissed(true);
    // Hand focus to the real content for keyboard users once the overlay
    // that was covering it disappears.
    requestAnimationFrame(() => {
      contentRef.current?.focus();
    });
  }

  function skip() {
    videoRef.current?.pause();
    dismiss();
  }

  function play() {
    setPhase("playing");
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    const playResult = v.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => setPhase("error"));
    }
  }

  function handleEnded() {
    if (prefersReducedMotion()) {
      // No transition will actually run (see the CSS), so skip straight to
      // the reveal instead of waiting out a fade that was never visible.
      dismiss();
      return;
    }
    setPhase("ending");
    endingTimeoutRef.current = setTimeout(dismiss, 900);
  }

  function handleFadeTransitionEnd(e: ReactTransitionEvent<HTMLElement>) {
    if (e.target !== e.currentTarget || e.propertyName !== "opacity") return;
    if (phase !== "ending") return;
    if (endingTimeoutRef.current) clearTimeout(endingTimeoutRef.current);
    dismiss();
  }

  function handleError() {
    setPhase("error");
  }

  return (
    <>
      {gateVisible && (
        <main
          className={`gateway phase-${phase}`}
          role="dialog"
          aria-modal="true"
          aria-label="The Last Great Pharaoh — intro"
          onTransitionEnd={handleFadeTransitionEnd}
        >
          <noscript>
            {/* Base CSS pins .gateway as a fixed full-viewport overlay so it
                can sit on top of the real content while JS is driving the
                play/dismiss interaction. Without JS that interaction never
                happens, so drop it back into normal document flow — a
                visitor can simply scroll past this one-screen intro to
                reach the real page underneath. */}
            <style>{".gateway{position:relative!important}"}</style>
          </noscript>
          <div className="gateway-grain" aria-hidden="true" />
          <video
            ref={videoRef}
            className="intro-video"
            aria-hidden="true"
            src="/video/tlgp-intro.mp4"
            playsInline
            preload="auto"
            disablePictureInPicture
            onEnded={handleEnded}
            onError={handleError}
          />
          {(phase === "entry" || phase === "error") && (
            <div className="gateway-content">
              <p className="eyebrow">A historical epic by B. C. Arsenios</p>
              <h1>
                The Last
                <br />
                <em>Great Pharaoh</em>
              </h1>
              {phase === "error" && (
                <p className="intro-error-msg" role="alert">
                  The intro couldn&apos;t play. You can try again or continue to the site.
                </p>
              )}
              <button
                type="button"
                className="enter-button"
                onClick={play}
                aria-label={phase === "error" ? "Try playing the intro video again" : "Play the intro video, with sound"}
              >
                {phase === "error" ? "Try Again" : "Play Intro"}
              </button>
              <button
                type="button"
                className="skip-button"
                onClick={skip}
                aria-label="Skip the intro and go to the homepage"
              >
                Skip Intro
              </button>
            </div>
          )}
          {phase === "playing" && (
            <button
              type="button"
              className="skip-button discreet-skip"
              onClick={skip}
              aria-label="Skip the intro and go to the homepage"
            >
              Skip Intro
            </button>
          )}
        </main>
      )}
      <div ref={contentRef} tabIndex={-1} aria-hidden={gateActive || undefined} inert={gateActive || undefined}>
        {children}
      </div>
    </>
  );
}
