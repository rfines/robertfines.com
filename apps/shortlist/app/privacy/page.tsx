import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Retold collects, uses, and protects your personal information.",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "March 1, 2026";
const CONTACT_EMAIL = "privacy@retold.dev";
const SITE_URL = "https://www.retold.dev";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            Retold
          </Link>
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted)] mb-10">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="prose-style space-y-10">

          <Section title="1. Overview">
            <p>
              Retold (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the website{" "}
              <a href={SITE_URL} className="text-[var(--accent)] hover:underline">
                {SITE_URL}
              </a>{" "}
              and the Retold application (the &ldquo;Service&rdquo;). This Privacy Policy explains what
              personal information we collect, how we use it, who we share it with, and the rights
              you have over your data.
            </p>
            <p>
              By using the Service you agree to the practices described in this policy. If you do
              not agree, please do not use the Service.
            </p>
            <p className="text-sm text-[var(--muted)] border border-[var(--border)] rounded-lg px-4 py-3 bg-[var(--surface)]">
              <strong>Note:</strong> This policy is a working draft and has not yet been reviewed by
              legal counsel. It will be updated to reflect any additional legal requirements before
              the Service is publicly launched.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <SubSection heading="2.1 Account information">
              <p>
                When you sign in via Google, GitHub, or LinkedIn OAuth, we receive your name,
                email address, and profile picture URL from that provider. We do not receive or
                store your OAuth provider password.
              </p>
            </SubSection>

            <SubSection heading="2.2 Resume and job-description content">
              <p>
                You may upload or paste resume text and job descriptions into the Service. This
                content is stored in our database and in Amazon Web Services (AWS) S3 for file
                uploads (PDF, DOCX). It is also transmitted to Anthropic&rsquo;s API (see
                section 4) to generate tailored output.
              </p>
            </SubSection>

            <SubSection heading="2.3 Tailored resume output">
              <p>
                The AI-generated tailored resumes, cover letters, and keyword match scores
                produced by the Service are stored in our database and associated with your
                account.
              </p>
            </SubSection>

            <SubSection heading="2.4 Payment information">
              <p>
                Paid plan subscriptions are handled by Stripe. We do not store your full
                card number, CVV, or bank account details. We store only your Stripe
                customer ID and current subscription status.
              </p>
            </SubSection>

            <SubSection heading="2.5 Usage analytics">
              <p>
                We use PostHog to collect anonymized product analytics (pages visited,
                features used, error rates). PostHog is configured in server-side mode;
                no third-party JavaScript analytics runs in your browser.
              </p>
            </SubSection>

            <SubSection heading="2.6 Log data">
              <p>
                Our hosting provider (Railway) may log standard server access logs
                including IP address, browser user-agent, and request timestamps. These
                logs are retained for up to 30 days for security and debugging purposes.
              </p>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>To authenticate your identity and maintain your account.</li>
              <li>
                To provide the core Service: generating AI-tailored resumes, keyword match
                scores, ATS analysis, and cover letters.
              </li>
              <li>To process subscription payments and manage your billing status.</li>
              <li>
                To send transactional emails (e.g., password reset, billing receipts) if
                and when email features are enabled.
              </li>
              <li>
                To understand how the Service is used in aggregate and improve its
                features and reliability.
              </li>
              <li>
                To comply with legal obligations and enforce our Terms of Service.
              </li>
            </ul>
            <p>
              We do not sell your personal information to third parties. We do not use your
              resume content to train AI models beyond Anthropic&rsquo;s standard API terms
              (see section 4).
            </p>
          </Section>

          <Section title="4. Third-Party Service Providers">
            <p>
              We share data with the following sub-processors only to the extent necessary to
              operate the Service:
            </p>
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                    <th className="text-left px-4 py-3 font-semibold">Provider</th>
                    <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold">Data sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <Row provider="Anthropic" purpose="AI text generation (Claude API)" data="Resume text, job descriptions" />
                  <Row provider="Stripe" purpose="Payment processing" data="Email, subscription metadata" />
                  <Row provider="Amazon Web Services (S3)" purpose="File storage for uploaded resumes" data="Resume file contents" />
                  <Row provider="PostHog" purpose="Product analytics" data="Anonymized usage events" />
                  <Row provider="Railway" purpose="Application hosting and infrastructure" data="All application traffic (server-side)" />
                  <Row provider="Google / GitHub / LinkedIn" purpose="OAuth sign-in" data="Email, name (returned to us)" />
                </tbody>
              </table>
            </div>
            <p>
              Anthropic&rsquo;s API usage is subject to their{" "}
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Privacy Policy
              </a>
              . By default, Anthropic does not use API inputs and outputs to train models.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your account data and resume content for as long as your account is
              active. You may request deletion of your account and all associated data at any
              time by contacting us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p>
              Anonymized, aggregated analytics data may be retained indefinitely as it cannot
              be linked back to an individual.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li>
                <strong>Access</strong> — request a copy of the personal data we hold about you.
              </li>
              <li>
                <strong>Correction</strong> — request that inaccurate data be corrected.
              </li>
              <li>
                <strong>Deletion</strong> — request that your account and associated data be
                permanently deleted.
              </li>
              <li>
                <strong>Portability</strong> — request an export of your resume content and
                tailored outputs in a machine-readable format.
              </li>
              <li>
                <strong>Objection</strong> — object to the processing of your data for analytics
                purposes.
              </li>
            </ul>
            <p>
              To exercise any of these rights, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="7. Cookies and Tracking">
            <p>
              The Service uses a single session cookie (&ldquo;authjs.session-token&rdquo;) to
              maintain your authenticated session. No advertising or third-party tracking cookies
              are set. We do not use fingerprinting or cross-site tracking technologies.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We use industry-standard measures including TLS encryption in transit, encrypted
              storage for secrets, and access controls to protect your data. No method of
              transmission over the internet is completely secure, and we cannot guarantee
              absolute security.
            </p>
          </Section>

          <Section title="9. Children&rsquo;s Privacy">
            <p>
              The Service is not directed at children under 13 years of age. We do not knowingly
              collect personal information from children under 13. If you believe we have
              inadvertently collected such information, please contact us immediately.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update
              the effective date at the top of this page. Material changes will be communicated
              via an in-app notice or email. Your continued use of the Service after changes
              take effect constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions, requests, or complaints about this Privacy Policy should be directed to:
            </p>
            <address className="not-italic mt-3 text-sm space-y-1">
              <p className="font-semibold">Retold</p>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <a href={SITE_URL} className="text-[var(--accent)] hover:underline">
                  {SITE_URL}
                </a>
              </p>
            </address>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-sm font-bold">Retold</span>
          <p className="text-xs text-[var(--muted)]">© 2026 Retold. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
        {children}
      </div>
    </section>
  );
}

function SubSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-[var(--foreground)]">{heading}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  provider,
  purpose,
  data,
}: {
  provider: string;
  purpose: string;
  data: string;
}) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium">{provider}</td>
      <td className="px-4 py-3 text-[var(--muted)]">{purpose}</td>
      <td className="px-4 py-3 text-[var(--muted)]">{data}</td>
    </tr>
  );
}
