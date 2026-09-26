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
   - Kit's response tells us whether this subscriber was newly added to the form (201) or was already on it (200). With auto-confirm enabled on the Kit form, a new subscriber is immediately eligible for the welcome sequence. A real new form membership also receives a random conversion ID; silently discarded bot submissions do not.
4. The form shows a loading state while waiting. On success, the browser is redirected to `/join/success?status=new` or `/join/success?status=existing` — no email address or other personal data is placed in that URL. A random ID returned only for a real new form membership is held in the current page's JavaScript memory and consumed when the consent-gated Meta `Lead` and Google Ads conversion fire. Direct or repeated success-page visits cannot create conversions. On failure, an error message replaces the form in place so the visitor can retry without losing what they typed.

## Where settings live

- **Kit API key** — stored as the `KIT_API_KEY` environment variable in the Vercel project (Settings → Environment Variables), set for both Production and Preview. Never committed to the repo.
- **Kit Form ID** — `9836625` (the "Osiris Rising Prelaunch" form). Not a secret, so it's a plain constant at the top of `app/api/subscribe/route.ts`. If a new form is ever created in Kit, update that one constant.
- **Kit opt-in** — the form must have auto-confirm enabled (single opt-in) and its confirmation/incentive email disabled. The immediate welcome email belongs in the Kit sequence triggered when a new subscriber joins this form.
- **Signup copy** (headline, supporting text, button label, consent line) — currently duplicated in three places: the homepage section in `app/page.tsx`, the `/join` page in `app/join/page.tsx`, and the shared consent line in `SignupForm.tsx`. All approved by B. C. Arsenios on 2026-08-24; see the project's `TLGP_DECISIONS_LOG`.

## What's intentionally not here yet (future phases)

- No CAPTCHA/bot-protection service — the honeypot + timing check is the current line of defense. Consider a real service (e.g. Turnstile) if spam becomes a problem.
- The welcome-email copy and timing are managed in Kit, not this repository. The first sequence email should be set to send immediately when a new subscriber joins the "Osiris Rising Prelaunch" form.
- GA4, Google Ads conversion tracking, Meta Pixel, and Vercel Web Analytics are installed. Google and Meta events remain gated by the visitor's cookie choices.
- No rate limiting beyond the timing heuristic — Vercel's platform-level abuse protection is the current backstop.

## Privacy policy (added on `prelaunch-foundation`)

- Draft policy lives at `/privacy-policy` (`app/privacy-policy/page.tsx`), linked from the footer and from the signup consent line.
- It's a draft: several facts it cannot state (a legal entity name, a CAN-SPAM postal address, a subscriber data-retention period) are explicitly flagged inline as needing B. C. Arsenios's confirmation before this should be treated as final. See the "Open questions for B. C. Arsenios" section on the page itself.
