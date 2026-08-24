# Email signup integration

How the prelaunch reader-list signup works, and where its settings live.

## What's here

- **Homepage section** (`app/page.tsx`, `#join`) — a signup section embedded directly in the one-page homepage, between "Book One" and "Creator".
- **Dedicated page** (`app/join/page.tsx`, served at `/join`) — the same form on its own page, for linking from email, social, or ads.
- **Shared form component** (`app/components/SignupForm.tsx`) — both of the above render this one component, so there's a single place to change the form's behavior or copy.
- **API route** (`app/api/subscribe/route.ts`, served at `/api/subscribe`) — the only place that talks to Kit. The browser never sees the Kit API key.
- **Analytics stub** (`app/lib/analytics.ts`) — fires an `email_signup` event on successful signup. No analytics provider is installed yet (that's a later phase), so today this just logs to the console in development and no-ops in production unless `window.dataLayer` or `window.gtag` happens to exist.

## How a submission flows

1. Visitor fills in email (required) and first name (optional) and submits.
2. The form sends a POST to `/api/subscribe` with the email, first name, a UTM snapshot captured from the page URL on load, the current page path (as "source"), a honeypot field, and how long the form was open before submit.
3. The API route:
   - Silently accepts (without contacting Kit) anything that looks automated: the honeypot field filled in, or a submission faster than 1.2 seconds after page load.
   - Validates the email format.
   - Calls Kit's API twice: first to upsert the subscriber (`POST /v4/subscribers`), then to attach them to the "Osiris Rising Prelaunch" form (`POST /v4/forms/9836625/subscribers`), passing the page + UTM parameters as the `referrer`.
   - Kit's response tells us whether this subscriber was newly added to the form (201) or was already on it (200) — that's how the UI knows to show "You're in" vs. "You're already on the list."
4. The form shows a loading state while waiting, then either a success/duplicate message or an error message inline (no page reload, no separate "thank you" page — it replaces the form in place).

## Where settings live

- **Kit API key** — stored as the `KIT_API_KEY` environment variable in the Vercel project (Settings → Environment Variables), set for both Production and Preview. Never committed to the repo.
- **Kit Form ID** — `9836625` (the "Osiris Rising Prelaunch" form). Not a secret, so it's a plain constant at the top of `app/api/subscribe/route.ts`. If a new form is ever created in Kit, update that one constant.
- **Signup copy** (headline, supporting text, button label, consent line) — currently duplicated in three places: the homepage section in `app/page.tsx`, the `/join` page in `app/join/page.tsx`, and the shared consent line in `SignupForm.tsx`. All approved by B. C. Arsenios on 2026-08-24; see the project's `TLGP_DECISIONS_LOG`.

## What's intentionally not here yet (future phases)

- No CAPTCHA/bot-protection service — the honeypot + timing check is the current line of defense. Consider a real service (e.g. Turnstile) if spam becomes a problem.
- No welcome-email automation configured in Kit yet.
- No privacy policy page yet — the consent line does not currently link to one.
- No GA4/Meta Pixel/GTM — the `trackEvent` call is ready to be wired to a real provider once one is installed.
- No rate limiting beyond the timing heuristic — Vercel's platform-level abuse protection is the current backstop.
