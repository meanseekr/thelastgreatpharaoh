import { NextRequest, NextResponse } from "next/server";

// The Kit ("Osiris Rising Prelaunch") form this site sends readers to.
// Not a secret — safe to keep as a plain constant. The API key that
// authenticates these requests lives only in the KIT_API_KEY environment
// variable set in Vercel, never in this file.
const KIT_FORM_ID = "9836625";
const KIT_API_BASE = "https://api.kit.com/v4";

// Below this elapsed time (ms) between page load and submit, treat the
// request as very likely automated and drop it quietly. Real visitors
// filling in two fields by hand essentially never do it this fast.
const MIN_HUMAN_SUBMIT_MS = 1200;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubscribeBody {
  email?: string;
  firstName?: string;
  hp?: string; // honeypot — should always arrive empty from real users
  elapsedMs?: number;
  source?: string;
  utm?: Record<string, string>;
}

function buildReferrer(source: string | undefined, utm: Record<string, string> | undefined) {
  const base = "https://thelastgreatpharaoh.com" + (source && source.startsWith("/") ? source : "/");
  const params = new URLSearchParams();
  if (utm) {
    for (const [key, value] of Object.entries(utm)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export async function POST(req: NextRequest) {
  let body: SubscribeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const firstName = (body.firstName || "").trim();

  // Honeypot: a real visitor never fills this in (it's hidden from sighted
  // users and skipped by keyboard nav). If it's filled, pretend success so
  // the bot doesn't learn anything, but never call the Kit API.
  if (body.hp) {
    return NextResponse.json({ status: "new" }, { status: 201 });
  }

  // Timing check: reject implausibly fast submissions the same quiet way.
  if (typeof body.elapsedMs === "number" && body.elapsedMs < MIN_HUMAN_SUBMIT_MS) {
    return NextResponse.json({ status: "new" }, { status: 201 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 422 });
  }

  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.error("KIT_API_KEY is not set — cannot submit to Kit.");
    return NextResponse.json(
      { message: "Signup is temporarily unavailable. Please try again shortly." },
      { status: 500 }
    );
  }

  const referrer = buildReferrer(body.source, body.utm);

  try {
    // 1. Upsert the subscriber (creates them if new, updates first name if not).
    const upsertRes = await fetch(`${KIT_API_BASE}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({
        email_address: email,
        ...(firstName ? { first_name: firstName } : {}),
      }),
    });

    if (!upsertRes.ok) {
      const detail = await upsertRes.text().catch(() => "");
      console.error("Kit subscriber upsert failed:", upsertRes.status, detail);
      return NextResponse.json(
        { message: "Something went wrong. Please try again in a moment." },
        { status: 502 }
      );
    }

    // 2. Attach the subscriber to the prelaunch form (this is what triggers
    // any welcome sequence attached to the form, and records UTM referrer).
    const formRes = await fetch(`${KIT_API_BASE}/forms/${KIT_FORM_ID}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({
        email_address: email,
        referrer,
      }),
    });

    if (!formRes.ok) {
      const detail = await formRes.text().catch(() => "");
      console.error("Kit add-to-form failed:", formRes.status, detail);
      return NextResponse.json(
        { message: "Something went wrong. Please try again in a moment." },
        { status: 502 }
      );
    }

    // Kit returns 201 when this subscriber is newly added to this form,
    // 200 when they were already on it — that's our duplicate signal.
    const status = formRes.status === 200 ? "existing" : "new";
    return NextResponse.json({ status }, { status: 200 });
  } catch (err) {
    console.error("Kit API request failed:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again in a moment." },
      { status: 502 }
    );
  }
}
