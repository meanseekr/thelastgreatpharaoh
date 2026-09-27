import type { Metadata } from "next";
import Link from "next/link";
import SignupForm from "../components/SignupForm";

export const metadata: Metadata = {
  title: "Join the Reader List | The Last Great Pharaoh",
  description:
    "Join the reader list and receive the opening excerpt from The Last Great Pharaoh: Osiris Rising immediately by email.",
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
          Join the reader list and receive the opening excerpt from <em>The Last Great Pharaoh: Osiris Rising</em>{" "}
          immediately by email, followed by occasional updates as the project moves toward publication.
        </p>
        <SignupForm idPrefix="joinpage" />
        <Link className="gold-link" href="/">
          ← Back to the world
        </Link>
      </div>
    </main>
  );
}
