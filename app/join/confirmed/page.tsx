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
          Your subscription to the reader list for Osiris Rising is confirmed. Your first update — early
          chapters, exclusive artwork, and historical notes — is on its way.
        </p>
        <p className="deck">
          You&apos;re stepping into the years the Late Bronze Age came apart — empires that had stood for
          centuries falling in the span of a single lifetime, and Egypt fighting to be the one civilization
          that didn&apos;t disappear with them. Watch for a queen holding a threatened throne together, an
          aging general who can feel the order he&apos;s sworn to protect slipping from his grasp, and
          Proteus, a boy already displaced by this same collapse, about to be swept into Egypt&apos;s fight
          for hers.
        </p>
        <Link className="gold-link" href="/">← Back to the world</Link>
      </div>
    </main>
  );
}
