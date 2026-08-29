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
      <p className="updated">Last updated August 2026</p>

      <div className="draft-notice">
        <strong>Please note:</strong> This policy describes the website&apos;s current technical setup
        in plain language. It is <strong>not legal advice</strong>. If advertising or cross-site
        tracking tools are added in the future, we recommend a review by counsel familiar with
        applicable law (e.g. GDPR, CCPA, CAN-SPAM) before those changes go live.
      </div>

      <h2>Who we are</h2>
      <p>
        This Privacy Policy describes how <strong>The Last Great Pharaoh</strong> website
        (thelastgreatpharaoh.com) collects and uses information from visitors and reader-list
        subscribers.
      </p>
      <p>
        The Last Great Pharaoh is operated by B.&nbsp;C.&nbsp;Arsenios, an independent author based in
        California.
      </p>

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
      <p>
        In keeping with U.S. CAN-SPAM requirements, our marketing emails include the following postal
        address:
      </p>
      <p className="postal-address">
        B.&nbsp;C.&nbsp;Arsenios / The Last Great Pharaoh<br />
        c/o Mofongos<br />
        5757 Lankershim Blvd<br />
        North Hollywood, CA 91601
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your subscriber information for as long as you remain subscribed to the reader list, so
        we can continue sending the updates you signed up for.
      </p>
      <p>
        After you unsubscribe, we retain only the minimum suppression record necessary to honor your
        opt-out and to meet our legal obligations. Any other information is deleted upon a verified
        deletion request, unless retention is legally required.
      </p>

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
        contact us to ask what information we hold about you or to request that it be deleted. Depending
        on where you live, laws such as the EU/UK GDPR or the California CCPA/CPRA may give you further
        rights; contact us using the email address below and we will respond as those laws require.
      </p>

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

      <Link className="gold-link dark back-link" href="/">← Back to the world</Link>
    </main>
  );
}
