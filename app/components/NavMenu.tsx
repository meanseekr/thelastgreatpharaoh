"use client";

import { useState } from "react";

/**
 * The mobile nav's open/close toggle. Split out from the (now server-
 * rendered) homepage so that only this small interactive sliver needs to be
 * a client component — the links themselves are plain anchors and work
 * without JavaScript; on desktop widths they're visible via CSS regardless
 * of this component's state (see the `.nav-links` rule in globals.css).
 */
export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={open ? "nav-links open" : "nav-links"}>
        <a href="#world">The World</a>
        <a href="#book">Book One</a>
        <a href="#join">Join the List</a>
        <a href="#creator">Creator</a>
      </div>
      <button
        className="menu"
        onClick={() => setOpen(!open)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        Menu
      </button>
    </>
  );
}
