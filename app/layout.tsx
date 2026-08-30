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
        {children}
        <ConsentManager />
        <Analytics />
      </body>
    </html>
  );
}
