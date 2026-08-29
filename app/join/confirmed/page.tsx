import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're In | The Last Great Pharaoh",
  description: "Your subscription to The Last Great Pharaoh reader list is confirmed.",
};

// Reached only after a reader clicks the confirmation link in the email Kit
// sends them — this is the actual end of the double opt-in flow. Kit's
// "send subscriber data to thank you page" setting is off, so this page
// never receives (and never reads) an email address or any other personal
// data in its URL; it's intentionally a plain static page.
export default function JoinConfirmedPage() {
  return (
    <main className="joinpage">
      <div className="joinpage-grain" />
      <div className="joinpage-content">
        <p className="eyebrow">The Last Great Pharaoh</p>
        <h1>
          You&apos;re In.<br /><em>Welcome to the World</em>
        </h1>
        <p className="deck">
          Your subscription to the reader list for Osiris Rising is confirmed. You&apos;ll receive occasional
          updates as the project moves toward publication, including release news, selected artwork, and
          behind-the-scenes historical material.
        </p>
        <p className="deck">
          Osiris Rising is the opening of The Last Great Pharaoh, a historical epic set as the Late Bronze
          Age world begins to collapse and Egypt fights to survive what follows.
        </p>
        <Link className="gold-link" href="/">← Back to the world</Link>
      </div>
    </main>
  );
}
