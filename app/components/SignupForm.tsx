"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { trackEvent } from "../lib/analytics";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export default function SignupForm({ idPrefix = "join" }: { idPrefix?: string }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const loadedAt = useRef<number>(0);
  const utmRef = useRef<Record<string, string>>({});

  useEffect(() => {
    loadedAt.current = Date.now();
    const params = new URLSearchParams(window.location.search);
    const captured: Record<string, string> = {};
    UTM_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) captured[key] = value;
    });
    utmRef.current = captured;
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          hp,
          elapsedMs: Date.now() - loadedAt.current,
          source: window.location.pathname,
          utm: utmRef.current,
        }),
      });

      const data = await res.json().catch(() => ({} as { status?: string; message?: string }));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.message || "Something went wrong. Please try again in a moment.");
        return;
      }

      const result = data?.status === "existing" ? "duplicate" : "success";
      setStatus(result);
      trackEvent("email_signup", { source: window.location.pathname, result });
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again in a moment.");
    }
  }

  if (status === "success" || status === "duplicate") {
    return (
      <div className="signup-form signup-done" role="status" aria-live="polite">
        <p className="signup-confirm">
          {status === "success"
            ? "You're in. Watch your inbox for the first update."
            : "You're already on the list — thank you!"}
        </p>
      </div>
    );
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${idPrefix}-email`}>Email</label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
        />
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-firstName`}>First name (optional)</label>
        <input
          id={`${idPrefix}-firstName`}
          name="firstName"
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={status === "loading"}
        />
      </div>

      {/* Honeypot — invisible to sighted users, skipped by keyboard tab order.
          Real visitors never fill this in; if it arrives filled, the API
          route quietly ignores the submission. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input
          id={`${idPrefix}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="enter-button signup-submit"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? "Joining…" : "Enter the World"}
      </button>

      <p className="consent">
        By joining, you agree to receive email updates about The Last Great Pharaoh. You can unsubscribe anytime.
      </p>

      {status === "error" && (
        <p className="signup-error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
