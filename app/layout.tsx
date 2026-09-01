import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import ConsentManager from "./components/ConsentManager";
import { buildConsentBootstrapScript } from "./lib/gtag";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Last Great Pharaoh | B. C. Arsenios",
  description: "An epic historical universe set at the end of the Bronze Age.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Runs before React hydrates (next/script's beforeInteractive
            strategy injects this into the initial HTML and executes it
            before any other page JavaScript, including hydration) — see
            the file-level comment in app/lib/gtag.ts for why this exists:
            a returning visitor's stored consent choice needs to reach
            Google Consent Mode before ConsentManager's mount effect ever
            runs, not after. Does nothing if there's no stored choice yet. */}
        <Script id="tlgp-consent-bootstrap" strategy="beforeInteractive">
          {buildConsentBootstrapScript()}
        </Script>
        {/* Rendered before {children} so its mount effect (which lazily
            creates the window.gtag / window.fbq stubs — see
            app/components/ConsentManager.tsx) runs before any page-level
            tracker that depends on those globals, such as
            app/join/confirmed/ConfirmedSignupTracker.tsx. React fires
            passive effects in tree/document order, so this ordering is
            load-bearing: with ConsentManager after {children}, a page's own
            effect could run first and find window.gtag/window.fbq still
            undefined. See TLGP_DECISIONS_LOG for the bug this fixed. */}
        <ConsentManager />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
