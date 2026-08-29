import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The Last Great Pharaoh",
  description: "How The Last Great Pharaoh collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <p className="eyebrow">The Last Great Pharaoh</p>
      <h1>Privacy Policy</h1>
      <p className="updated">Draft prepared August 2026 — not yet reviewed or approved</p>

      <div className="draft-notice">
        <strong>Draft status:</strong> This policy was drafted to accurately describe the website&apos;s
        current technical setup. It is <strong>not legal advice</strong>, and it has not yet been reviewed
        by B.&nbsp;C.&nbsp;Arsenios or by an attorney. Several details below are explicitly flagged as
        needing author confirmation before this page should be treated as final. Given that this site
        collects email addresses, we recommend a brief review by counsel familiar with applicable law
        (e.g. GDPR, CCPA, CAN-SPAM) before publishing, especially once advertising trackers are added.
      </div>

      <h2>Who we are</h2>
      <p>
        This Privacy Policy describes how <strong>The Last Great Pharaoh</strong> website
        (thelastgreatpharaoh.com), created by author B.&nbsp;C.&nbsp;Arsenios, collects and uses
        information from visitors and reader-list subscribers.
      </p>
      <div className="flag">
        <b>Author confirmation needed:</b> is there a registered business entity (e.g. an LLC or
        publishing imprint) that should be named here as the data controller, or should this policy
        refer only to B.&nbsp;C.&nbsp;Arsenios as an individual / pen name? We have not been given a
        legal entity name and have not invented one.
      </div>

      <h2>Information we collect</h2>
      <p>We collect information in two ways:</p>
      <ul>
        <li>
          <strong>Information you provide directly.</strong> If you join the reader list, we collect the
          email address you enter (required) and, if you choose to give it, your first name (optional).
        </li>
        <li>
          <strong>Information collected automatically.</strong> When you submit the reader-list form, we
          automatically capture the page you signed up from and any UTM campaign parameters present in
          the page&apos;s URL at that moment (for example, which link or ad brought you to the site), so
          we can tell which pages and campaigns are working. Separately, our hosting and analytics
          providers may collect standard technical data about your visit — see &ldquo;Website
          analytics&rdquo; below.
        </li>
      </ul>
      <p>We do not ask for or knowingly collect payment information, government ID numbers, or other sensitive personal data through this site.</p>

      <h2>How we use your information</h2>
      <ul>
        <li>To send you email updates about The Last Great Pharaoh and Osiris Rising that you&apos;ve asked to receive — release news, early chapters, artwork, and behind-the-scenes updates.</li>
        <li>To understand, in aggregate, which pages and campaigns bring readers to the site.</li>
        <li>To detect and prevent spam or automated abuse of the signup form.</li>
      </ul>
      <p>We do not sell your personal information, and we do not share your email address with third parties for their own marketing purposes.</p>

      <h2>Email communications and unsubscribe rights</h2>
      <p>
        If you join the reader list, we&apos;ll send you email updates about The Last Great Pharaoh. Every
        email includes an unsubscribe link, and you can opt out at any time — doing so removes you from
        future mailings.
      </p>
      <div className="flag">
        <b>Author confirmation needed:</b> U.S. CAN-SPAM rules require every marketing email to include a
        valid postal address. Please provide an address (a P.O. box is acceptable) to add to the Kit
        email template footer; we have not invented one.
      </div>

      <h2>Data retention</h2>
      <p>
        We keep your email address and subscription information for as long as you remain subscribed to
        the reader list, so we can continue sending the updates you signed up for.
      </p>
      <div className="flag">
        <b>Author confirmation needed:</b> how long should subscriber data be kept after someone
        unsubscribes or asks to be removed — deleted immediately, kept for a defined period, or retained
        indefinitely in an unsubscribed state? We have not been given a retention period and have not
        assumed one.
      </div>

      <h2>Third-party service providers</h2>
      <p>We use a small number of third-party services to run this site. Each processes data under its own privacy policy:</p>
      <ul>
        <li>
          <strong>Vercel</strong> — hosts this website and serves every page you visit. See{" "}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel&apos;s Privacy Policy</a>.
        </li>
        <li>
          <strong>Kit</strong> — stores reader-list subscriptions and sends our email updates. When you
          join the list, your email address (and first name, if given) is sent to and stored by Kit. See{" "}
          <a href="https://kit.com/privacy" target="_blank" rel="noopener noreferrer">Kit&apos;s Privacy Policy</a>.
        </li>
      </ul>

      <h2>Website analytics</h2>
      <p>
        We use Vercel Web Analytics to understand overall traffic to the site — for example, how many
        people visit and which pages they view. It is designed not to use cookies and not to track you
        individually across websites; it reports aggregated counts rather than an individual visitor
        profile. See{" "}
        <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">
          Vercel&apos;s Web Analytics privacy documentation
        </a>{" "}
        for detail on exactly what it collects.
      </p>

      <h2>Future analytics and advertising technologies</h2>
      <p>
        We may in the future add additional analytics or advertising tools not in use today — for
        example, Google Analytics, Google Tag Manager, or the Meta (Facebook/Instagram) Pixel, to help us
        understand how readers find the site and to measure the results of advertising campaigns. Tools
        like these typically use cookies or similar technology and may share limited data with the
        provider (e.g. Google or Meta). If and when we add any of them, we will update this policy first
        to describe what&apos;s added and what it collects.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        This site is not directed to children, and we do not knowingly collect personal information from
        children under 13. If you believe a child has provided us with personal information, please
        contact us using the details below so we can remove it.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        You can unsubscribe from emails at any time using the link in any message we send. You can also
        contact us to ask what information we hold about you or to request that it be deleted.
      </p>
      <div className="flag">
        <b>Author confirmation needed:</b> depending on where readers are located, laws such as the EU/UK
        GDPR or the California CCPA/CPRA may grant additional rights (e.g. data portability, a formal
        right to erasure, or an opt-out of &ldquo;sale/sharing&rdquo; once ad trackers are added). This
        draft describes the practical unsubscribe/deletion process available today; a legal reviewer
        should confirm whether more formal rights language is required for this audience.
      </div>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy as the site changes — for example, when we add a new analytics
        or advertising tool. We&apos;ll update the date at the top of this page when we do, and material
        changes will be reflected here before they take effect.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy or your information can be sent to{" "}
        <a href="mailto:hello@thelastgreatpharaoh.com">hello@thelastgreatpharaoh.com</a>.
      </p>

      <div className="open-questions">
        <h2>Open questions for B. C. Arsenios</h2>
        <ul>
          <li>Should this policy name a formal legal/business entity, or refer only to the author?</li>
          <li>What postal address should appear in marketing emails (CAN-SPAM requirement)?</li>
          <li>What should the subscriber data retention period be after someone unsubscribes?</li>
          <li>Should a lawyer review this before it&apos;s treated as final, particularly for GDPR/CCPA-style rights language?</li>
        </ul>
      </div>

      <Link className="gold-link dark back-link" href="/">← Back to the world</Link>
    </main>
  );
}
