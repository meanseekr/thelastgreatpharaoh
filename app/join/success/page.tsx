import type { Metadata } from "next";
import Link from "next/link";
import SuccessfulSignupTracker from "./SuccessfulSignupTracker";

export const metadata: Metadata = {
  title: "Welcome | The Last Great Pharaoh",
  description: "Welcome to The Last Great Pharaoh reader list.",
};

// `?status=new|existing` is the only thing this URL carries — never an email
// address or other personal data. A random conversion handoff is kept only
// in the browser's current JavaScript memory (see SignupForm.tsx and
// app/lib/signupConversion.ts), so direct visits cannot create conversions.
//
// With Kit configured for single opt-in, a newly attached subscriber is
// confirmed immediately and their welcome sequence can begin. `status=new`
// is also the only case that counts as a new advertising conversion;
// returning subscribers do not create duplicate Leads.
export default async function JoinSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const alreadySubscribed = status === "existing";
  const isNewSubscriber = !alreadySubscribed;

  return (
    <main className="joinpage">
      <SuccessfulSignupTracker isNewSubscriber={isNewSubscriber} />
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
            ? "You're already on the reader list for Osiris Rising. No further action is needed."
            : "You're now on the reader list for Osiris Rising. Your first email introduces the book, its world, and the history behind the story."}
        </p>
        {!alreadySubscribed && (
          <p className="deck">
            Osiris Rising opens The Last Great Pharaoh, a historical epic set as the Late Bronze Age
            world begins to collapse and Egypt fights to survive what follows.
          </p>
        )}
        <Link className="gold-link" href="/">← Back to the world</Link>
      </div>
    </main>
  );
}
