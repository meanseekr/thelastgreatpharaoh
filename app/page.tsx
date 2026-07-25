"use client";

import { useState } from "react";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!entered) {
    return (
      <main className="gateway">
        <div className="gateway-grain" />
        <div className="gateway-content">
          <p className="eyebrow">A historical epic by B. C. Arsenios</p>
          <h1>The Last<br /><em>Great Pharaoh</em></h1>
          <button className="enter-button" onClick={() => setEntered(true)}>Enter the World</button>
          <button className="skip-button" onClick={() => setEntered(true)}>Skip intro</button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="hero" id="top">
        <nav className="nav">
          <a className="wordmark" href="#top">TLGP</a>
          <div className={menuOpen ? "nav-links open" : "nav-links"}>
            <a href="#world">The World</a><a href="#book">Book One</a><a href="#creator">Creator</a>
          </div>
          <button className="menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">Menu</button>
        </nav>
        <div className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Egypt · c. 1185 BC</p>
          <h1>The Last<br /><em>Great Pharaoh</em></h1>
          <p className="deck">When the old world burns, Egypt must decide what it will become.</p>
          <a className="gold-link" href="#world">Explore the world <span>↓</span></a>
        </div>
        <p className="hero-credit">Inspired by the final great civilization of the Bronze Age</p>
      </section>

      <section className="manifesto" id="world">
        <p className="section-label">The world at the edge</p>
        <h2>Empires fall.<br /><em>Egypt endures.</em></h2>
        <p>Across the Mediterranean, hunger, migration, and war have broken kingdoms that once seemed immortal. At the Nile’s mouth, one civilization prepares to meet a storm coming from the sea.</p>
      </section>

      <section className="book" id="book">
        <div><p className="section-label">Book One</p><h2><em>Osiris Rising</em></h2><p>Before Egypt can face the end of the world, it must survive itself. A queen fights for her throne. An aging general is summoned to save Memphis. Beyond Egypt, a displaced boy named Proteus watches the old world vanish.</p><a className="gold-link dark" href="mailto:hello@thelastgreatpharaoh.com?subject=Osiris%20Rising">Get release news <span>↗</span></a></div>
        <aside><span>01</span><p>THE BEGINNING<br />OF THE END</p></aside>
      </section>

      <section className="creator" id="creator"><p className="section-label">The creator</p><h2>B. C. Arsenios</h2><p>Building a historically grounded world of power, faith, survival, and the people who lived through civilization’s first great collapse.</p></section>
      <footer><span>© {new Date().getFullYear()} B. C. Arsenios</span><a href="mailto:hello@thelastgreatpharaoh.com">Contact</a><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
