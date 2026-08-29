import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "One More Step | The Last Great Pharaoh",
  description: "Check your inbox to confirm your subscription to The Last Great Pharaoh reader list.",
};

// `?status=new|existing` is the only thing this URL ever carries — no email
// address or other personal data is placed in it (see SignupForm.tsx).
//
// This page is reached the instant the signup form is submitted — before
// Kit's double opt-in confirmation has happened. It must never claim the
// subscription is complete; that's what /join/confirmed is for, once the
// reader has actually clicked the link in their confirmation email.
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
          One More<br /><em>Step</em>
        </h1>
        <p className="deck">
          {alreadySubscribed
            ? "You're already on the reader list for Osiris Rising. If you previously confirmed your subscription, no further action is needed. If you haven't, check your inbox for the confirmation email."
            : "We just sent a confirmation email to your inbox. Click the link inside it to join the reader list for Osiris Rising — nothing arrives until you do."}
        </p>
        {!alreadySubscribed && (
          <p className="deck">
            Don&apos;t see it in a minute or two? Check your spam or promotions folder — confirmation emails end up there more often than they should.
          </p>
        )}
        <Link className="gold-link" href="/">← Back to the world</Link>
      </div>
    </main>
  );
}
