import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How SnapForge UI collects, uses, and protects your data.',
};

const EFFECTIVE = 'June 29, 2026';
const CONTACT = 'hello@snapforgeui.com';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white/80">
      <main className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/" className="text-sm text-violet-300 hover:text-violet-200">
          ← Back to SnapForge UI
        </Link>
        <h1 className="mt-6 text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/45">Effective {EFFECTIVE}</p>

        <Section title="Who we are">
          SnapForge UI (&ldquo;SnapForge,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) provides a personal
          component vault where you save React and HTML components, preview them live, export them, and
          connect them to AI agents over MCP. This policy explains what we collect and how we use it.
        </Section>

        <Section title="Information we collect">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-white/90">Account information.</strong> When you sign in with
              Google or GitHub, we receive your name, email address, profile image, and a provider
              account identifier. We use this to create and secure your account.
            </li>
            <li>
              <strong className="text-white/90">Content you save.</strong> The components you add
              (source code, styles, demos, metadata, and any assets you upload) are stored under your
              account so we can show, preview, and export them for you.
            </li>
            <li>
              <strong className="text-white/90">Billing information.</strong> Payments are processed by
              Stripe. We do not see or store your full card details; we keep a customer/subscription
              reference and your plan status.
            </li>
            <li>
              <strong className="text-white/90">Access tokens.</strong> When you generate an MCP token,
              we store only a hashed version — never the raw token after it is first shown to you.
            </li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <ul className="ml-5 list-disc space-y-2">
            <li>Provide, maintain, and secure the service.</li>
            <li>Authenticate you and scope your vault to your account.</li>
            <li>Process subscriptions and manage your plan.</li>
            <li>
              Send transactional email — a welcome message and a confirmation when you start a paid
              plan. We do not send marketing email without your consent.
            </li>
          </ul>
        </Section>

        <Section title="Service providers">
          We share data only with the providers that run the service on our behalf:
          <ul className="ml-5 mt-2 list-disc space-y-2">
            <li><strong className="text-white/90">Supabase</strong> — database and storage.</li>
            <li><strong className="text-white/90">Stripe</strong> — payment processing and billing.</li>
            <li><strong className="text-white/90">Brevo</strong> — transactional email delivery.</li>
            <li><strong className="text-white/90">Vercel</strong> — application hosting.</li>
            <li><strong className="text-white/90">Google &amp; GitHub</strong> — sign-in.</li>
          </ul>
          We do not sell your personal information.
        </Section>

        <Section title="Cookies">
          We use a session cookie to keep you signed in. We do not use third-party advertising or
          cross-site tracking cookies.
        </Section>

        <Section title="Data retention and deletion">
          We keep your data for as long as your account is active. You can request deletion of your
          account and associated data at any time by emailing{' '}
          <a href={`mailto:${CONTACT}`} className="text-violet-300 hover:text-violet-200">{CONTACT}</a>.
        </Section>

        <Section title="Security">
          Access tokens are stored hashed, payment details never touch our servers, and your vault is
          scoped to your account. No system is perfectly secure, but we work to protect your data.
        </Section>

        <Section title="Children">
          SnapForge UI is not directed to children under 16, and we do not knowingly collect their data.
        </Section>

        <Section title="Changes">
          We may update this policy as the product evolves. Material changes will be reflected by the
          effective date above.
        </Section>

        <Section title="Contact">
          Questions about your privacy? Email{' '}
          <a href={`mailto:${CONTACT}`} className="text-violet-300 hover:text-violet-200">{CONTACT}</a>.
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 leading-relaxed">{children}</div>
    </section>
  );
}
