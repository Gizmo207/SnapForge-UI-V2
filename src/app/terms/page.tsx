import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of SnapForge UI.',
};

const EFFECTIVE = 'June 29, 2026';
const CONTACT = 'hello@snapforgeui.com';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white/80">
      <main className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/" className="text-sm text-violet-300 hover:text-violet-200">
          ← Back to SnapForge UI
        </Link>
        <h1 className="mt-6 text-4xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-white/45">Effective {EFFECTIVE}</p>

        <Section title="1. Agreement">
          By creating an account or using SnapForge UI (the &ldquo;Service&rdquo;), you agree to these
          Terms. If you do not agree, do not use the Service.
        </Section>

        <Section title="2. The Service">
          SnapForge UI lets you save React and HTML components to a personal vault, preview them in a
          sandbox, export them, and connect them to AI agents over the Model Context Protocol (MCP).
        </Section>

        <Section title="3. Accounts">
          You sign in through Google or GitHub and are responsible for activity under your account. Keep
          your credentials and any MCP tokens you generate secret; anyone holding a token can access
          your vault. You can revoke tokens at any time from the app.
        </Section>

        <Section title="4. Your content">
          You retain all rights to the components and content you add. You are responsible for ensuring
          you have the right to store and use that content. You grant us a limited license to host,
          process, and display it solely to provide the Service to you.
        </Section>

        <Section title="5. Acceptable use">
          <ul className="ml-5 list-disc space-y-2">
            <li>Do not use the Service for unlawful purposes or to store malicious code intended to harm others.</li>
            <li>Do not attempt to break, overload, or reverse-engineer the Service or its sandbox.</li>
            <li>Do not infringe the intellectual property or rights of others.</li>
          </ul>
          Component previews run inside a sandbox, but you should still review any code before trusting
          or shipping it.
        </Section>

        <Section title="6. Plans and billing">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-white/90">Free</strong> includes unlimited saves, live previews,
              and export. <strong className="text-white/90">Pro</strong> ($19/month) adds the MCP server
              and unlimited connection tokens. <strong className="text-white/90">Team</strong>
              ($49/month) adds a shared vault and up to five seats.
            </li>
            <li>Paid plans are billed on a recurring basis through Stripe until cancelled.</li>
            <li>You can cancel anytime; access continues until the end of the current billing period.</li>
            <li>Except where required by law, payments are non-refundable.</li>
            <li>We may change pricing with reasonable notice; changes do not affect the current paid period.</li>
          </ul>
        </Section>

        <Section title="7. Disclaimer">
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee
          that previews, exports, or third-party components will be error-free or fit for a particular
          purpose.
        </Section>

        <Section title="8. Limitation of liability">
          To the maximum extent permitted by law, SnapForge UI is not liable for any indirect,
          incidental, or consequential damages, or for loss of data or profits, arising from your use of
          the Service.
        </Section>

        <Section title="9. Termination">
          You may stop using the Service at any time. We may suspend or terminate access for violations
          of these Terms.
        </Section>

        <Section title="10. Changes">
          We may update these Terms as the product evolves. Continued use after changes take effect
          constitutes acceptance.
        </Section>

        <Section title="11. Governing law">
          These Terms are governed by the laws of the State of Maine, United States, without regard to
          conflict-of-law principles.
        </Section>

        <Section title="12. Contact">
          Questions? Email{' '}
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
