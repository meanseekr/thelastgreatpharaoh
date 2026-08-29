import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're In | The Last Great Pharaoh",
  description: "You've joined the reader list for Osiris Rising — check your inbox for your first update.",
};

// `?status=new|existing` is the only thing this URL ever carries — no email
// address or other personal data is placed in it (see SignupForm.tsx).
export default async function JoinSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const alreadySubscribed = status === "existing";

  return (
    <main className="joinpage">
      <div className="joinpage-grain" />
      <div className="joinpage-content">
        <p className="eyebrow">The Last Great Pharaoh</p>
        <h1>
          {alreadySubscribed ? (
            <>You&apos;re Already<br /><em>In the World</em></>
          ) : (
            <>You&apos;re In.<br /><em>Welcome to the World</em></>
          )}
        </h1>
        <p className="deck">
          {alreadySubscribed
            ? "You're already on the reader list for Osiris Rising — thank you for being here. Keep an eye on your inbox for updates."
            : "Check your inbox — your first update from The Last Great Pharaoh is on its way, with early chapters, exclusive artwork, and historical notes still to come."}
        </p>
        <Link className="gold-link" href="/">← Back to the world</Link>
      </div>
    </main>
  );
}
