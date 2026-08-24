import type { Metadata } from "next";
import SignupForm from "../components/SignupForm";

export const metadata: Metadata = {
  title: "Join the Reader List | The Last Great Pharaoh",
  description:
    "Join the reader list for the release of Osiris Rising, early chapters, exclusive artwork, historical notes, and behind-the-scenes updates.",
};

export default function JoinPage() {
  return (
    <main className="joinpage">
      <div className="joinpage-grain" />
      <div className="joinpage-content">
        <p className="eyebrow">The Last Great Pharaoh</p>
        <h1>
          Be First to
          <br />
          <em>Enter the World</em>
        </h1>
        <p className="deck">
          Join the reader list for the release of Osiris Rising, early chapters, exclusive artwork,
          historical notes, and behind-the-scenes updates.
        </p>
        <SignupForm idPrefix="joinpage" />
        <a className="gold-link" href="/">
          ← Back to the world
        </a>
      </div>
    </main>
  );
}
