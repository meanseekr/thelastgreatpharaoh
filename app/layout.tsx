import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Last Great Pharaoh | B. C. Arsenios",
  description: "An epic historical universe set at the end of the Bronze Age.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
