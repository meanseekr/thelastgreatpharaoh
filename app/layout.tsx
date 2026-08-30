import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import ConsentManager from "./components/ConsentManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Last Great Pharaoh | B. C. Arsenios",
  description: "An epic historical universe set at the end of the Bronze Age.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
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
