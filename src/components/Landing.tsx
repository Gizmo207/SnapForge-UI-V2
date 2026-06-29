'use client';

import { signIn } from 'next-auth/react';
import AnimatedPattern from './landing/vault/AnimatedPattern';
import { KineticText } from './landing/vault/KineticText';
import AnimatedButton from './landing/vault/AnimatedButton';
import GradientCard from './landing/vault/GradientCard';
import Card3D from './landing/vault/Card3D';
import AnimatedToggle from './landing/vault/AnimatedToggle';
import AnimatedLoader from './landing/vault/AnimatedLoader';
import LiquidLoader from './landing/vault/LiquidLoader';
import GamepadCheckbox from './landing/vault/GamepadCheckbox';
import { Marquee } from './landing/vault/Marquee';
import GlassSurface from './landing/vault/GlassSurface';
import TwoPiWave from './landing/vault/TwoPiWave';
import LightfallNeon from './landing/vault/LightfallNeon';

const PROD_URL = 'https://snap-forge-ui-v2.vercel.app';

/* The four ways a component gets into your vault — rendered as Gradient Cards */
const INGEST = [
  {
    title: 'Paste a snippet',
    description:
      "Drop in a single React or HTML component — plus optional CSS and a usage demo. It's parsed, classified, named, and saved to your library.",
    gradient: 'linear-gradient(-45deg, #7a5af8 0%, #df71ff 100%)',
    iconPath:
      'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z',
  },
  {
    title: 'Registry & CLI',
    description:
      'Paste `npx shadcn add @magicui/marquee` or a registry JSON URL. SnapForge fetches the real source and every registry dependency for you.',
    gradient: 'linear-gradient(-45deg, #11998e 0%, #38ef7d 100%)',
    iconPath: 'M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h10v4H4v-4zM8 5.5L6 7.5 8 9.5M11 5.5h3',
  },
  {
    title: 'Folder upload',
    description:
      'Multi-file component? Upload the whole folder. `@/` import aliases resolve automatically in the live preview.',
    gradient: 'linear-gradient(-45deg, #f7971e 0%, #ffd200 100%)',
    iconPath: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  },
  {
    title: '.zip import',
    description:
      'Bulk-import a zipped component. SnapForge unpacks it, runs the security gate, and gets it preview-ready in seconds.',
    gradient: 'linear-gradient(-45deg, #ff0f7b 0%, #f89b29 100%)',
    iconPath:
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM10 7h2v2h-2V7zm2 2h2v2h-2V9zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2z',
  },
];

/* Ecosystem sources + capabilities for the marquees */
const SOURCES = ['uiverse', 'React Bits', 'Magic UI', 'shadcn/ui', 'Aceternity', 'Paste a snippet', 'npx shadcn add'];
const CAPS = [
  '🔍 Live preview',
  '📦 Export ZIP',
  '🤖 MCP for agents',
  '🛡️ Security-gated',
  '🗂️ Auto-classified',
  '🔐 Owner-scoped',
  '⚛️ React & HTML',
];

const MCP_TOOLS = [
  { name: 'search_vault', desc: 'Keyword search across your saved components by name, tag, or category.' },
  { name: 'list_vault', desc: 'List everything in the library — optionally filtered to one category.' },
  { name: 'get_component', desc: 'Return export-ready source, deps, multi-file map, CSS, and demo.' },
];

const BLOCKED = ['eval()', 'new Function()', 'fetch / network', 'dangerouslySetInnerHTML', '<script> tags'];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-100 backdrop-blur-sm [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
      {children}
    </span>
  );
}

export function Landing() {
  // Every "Start your vault" CTA drops the visitor into the real auth flow.
  const startVault = () => void signIn();

  return (
    <div className="sf-landing relative min-h-screen overflow-x-hidden">
      {/* ---------- NAV ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
        <nav className="flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-[#0a0a14]/70 px-5 py-3 backdrop-blur-xl">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13.18 1.37 13.18 9.64 21.45 9.64 10.82 22.63 10.82 14.36 2.55 14.36 13.18 1.37" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight">SnapForge UI</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#preview" className="transition hover:text-white">Live preview</a>
            <a href="#mcp" className="transition hover:text-white">MCP</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </div>
          <AnimatedButton label="Start your vault" onClick={startVault} />
        </nav>
      </header>

      {/* ---------- HERO ---------- */}
      <section id="top" className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <LightfallNeon
            colors={['#A6C8FF', '#5227FF', '#FF9FFC']}
            backgroundColor="#0A29FF"
            streakCount={7}
            density={1}
            speed={0.6}
            glow={1.1}
            backgroundGlow={0.5}
            mouseInteraction
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_62%_at_50%_44%,_rgba(4,4,9,0.82)_0%,_rgba(4,4,9,0.45)_42%,_transparent_76%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#08080f]" />

        <div className="relative z-10 flex flex-col items-center">
          <SectionLabel>Your private component vault</SectionLabel>
          <KineticText
            text="SnapForge UI"
            className="mt-7 justify-center bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-6xl text-transparent sm:text-7xl md:text-8xl"
          />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 [text-shadow:0_2px_20px_rgba(0,0,0,0.7)] sm:text-xl">
            Save any React or HTML component to your own library — from uiverse, React Bits, Magic UI,
            shadcn, Aceternity, or your own code. SnapForge classifies it, previews it live, exports it,
            and hands it to your AI agent. <strong className="text-white">Any component you save, ready to ship.</strong>
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <AnimatedButton label="Start your vault" onClick={startVault} />
            <a href="#mcp" className="rounded-xl border border-white/25 bg-black/30 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] hover:border-white/40 hover:bg-black/45">
              Connect your AI →
            </a>
          </div>
          <p className="mt-8 font-mono text-xs text-white/40">React &amp; HTML · live sandbox previews · MCP-native</p>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <section className="relative z-10 space-y-3 border-y border-white/10 bg-[#08080f] py-6">
        <Marquee pauseOnHover className="[--duration:30s] [--gap:1.1rem]">
          {SOURCES.map((t) => (
            <div key={t} className="flex items-center whitespace-nowrap rounded-2xl border border-white/10 bg-gradient-to-br from-[#1c1c2e] to-[#13131f] px-6 py-3.5 text-base font-bold text-white/90">
              {t}
            </div>
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:34s] [--gap:1.1rem]">
          {CAPS.map((t) => (
            <div key={t} className="flex items-center whitespace-nowrap rounded-2xl border border-violet-400/15 bg-gradient-to-br from-[#1a1430] to-[#130f22] px-6 py-3.5 text-base font-bold text-violet-100/90">
              {t}
            </div>
          ))}
        </Marquee>
      </section>

      {/* ---------- HOW IT WORKS / 4 WAYS IN ---------- */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 py-28 text-center">
        <SectionLabel>Four ways in</SectionLabel>
        <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          However you found it, <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">it goes in the vault</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-white/60">
          Hover a card for the details. Paste, pull from a registry, or upload — every component is
          parsed, classified, security-gated, and stored under your account.
        </p>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {INGEST.map((f) => (
            <GradientCard key={f.title} title={f.title} description={f.description} gradient={f.gradient} iconPath={f.iconPath} />
          ))}
        </div>
      </section>

      {/* ---------- RAINBOW WAVE WALL (TWO PI) ---------- */}
      <section id="preview" className="relative z-10 border-y border-white/10">
        <div className="relative h-[520px] w-full overflow-hidden bg-[#070710]">
          <div className="absolute inset-0">
            <TwoPiWave
              dotRadius={2}
              dotSpacing={16}
              waveAmplitude={16}
              bulgeStrength={90}
              cursorRadius={420}
              glowRadius={220}
              sparkle
              gradientFrom="#ff8ad8"
              gradientTo="#7be0ff"
              glowColor="#1a0f2e"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#070710_92%)]" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <SectionLabel>Preview before you trust it</SectionLabel>
            <h2 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">See every component render live</h2>
            <p className="mx-auto mt-5 max-w-2xl text-white/70">
              Each save bundles in a real in-browser sandbox — Tailwind, the shadcn{' '}
              <code className="text-violet-200">cn()</code> helper, Magic UI keyframes, styled-components,
              WebGL, glass &amp; backdrop-filter. No &quot;looks right in the docs,&quot; then breaks in your app.{' '}
              <span className="text-white/90">Move your cursor across this wall — that&apos;s a vault component too.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ---------- SHOWCASE ---------- */}
      <section className="relative z-10 bg-[#07070d] py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <SectionLabel>Whatever you save, it just works</SectionLabel>
          <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Not snippets. <span className="text-white/50">Showpieces.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/60">
            3D cards, physical toggles, molten loaders, glowing devices — every tile below is a real
            saved component, previewing live, exactly as it would in your project.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <ShowcaseCell label="3D Card · components/cards">
              <Card3D heading="Saved this month" line1="Lives in" line2="your vault" />
            </ShowcaseCell>
            <ShowcaseCell label="Animated Toggle · primitives/toggles">
              <AnimatedToggle />
            </ShowcaseCell>
            <ShowcaseCell label="Power Pad · primitives/checkboxes">
              <GamepadCheckbox />
            </ShowcaseCell>
            <ShowcaseCell label="Molten Loader · primitives/loaders">
              <div className="py-6">
                <AnimatedLoader />
              </div>
            </ShowcaseCell>
            <ShowcaseCell label="Liquid Loader · primitives/loaders">
              <LiquidLoader label="Forging" />
            </ShowcaseCell>
            <ShowcaseCell label="Animated Button · primitives/buttons">
              <AnimatedButton label="Export ZIP" />
            </ShowcaseCell>
          </div>
        </div>
      </section>

      {/* ---------- MCP DIFFERENTIATOR ---------- */}
      <section id="mcp" className="relative z-10 border-y border-white/10 bg-[#08080f] py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <SectionLabel>The differentiator</SectionLabel>
            <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Hand your vault to your <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">AI agent</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-white/60">
              A remote MCP server connects Claude Code, Cursor, Windsurf, and VS Code straight to your
              library — read-only, behind a per-user token. Then just ask:{' '}
              <em className="text-white/85">&quot;build a landing page using only components from my SnapForge vault.&quot;</em>
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {MCP_TOOLS.map((tool) => (
              <GlassSurface key={tool.name} width="100%" height={180} borderRadius={22} className="w-full">
                <div className="flex h-full w-full flex-col justify-center px-7 text-left">
                  <code className="text-lg font-bold text-violet-200">{tool.name}</code>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{tool.desc}</p>
                </div>
              </GlassSurface>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-black/60 p-5 font-mono text-sm leading-relaxed text-white/80">
            <div><span className="select-none text-white/35">$ </span>claude mcp add snapforge --transport http \</div>
            <div className="pl-4 text-violet-300">{PROD_URL}/api/mcp \</div>
            <div className="pl-4">--header <span className="text-emerald-300">&quot;Authorization: Bearer sf_•••&quot;</span></div>
            <div className="mt-3 text-white/40"># tokens are owner-scoped — only the SHA-256 hash is ever stored</div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-white/55">
            {['Claude Code', 'Cursor', 'Windsurf', 'VS Code'].map((c) => (
              <span key={c} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-semibold">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SECURITY GATE ---------- */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionLabel>Safe by default</SectionLabel>
            <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Every paste runs the gate</h2>
            <p className="mt-5 max-w-xl text-white/60">
              Untrusted code from the internet never renders blind. A deterministic sanitization gate
              inspects each component and tags the outcome <code className="text-emerald-300">allowed</code>,{' '}
              <code className="text-rose-300">blocked</code>, or <code className="text-amber-300">invalid</code> before it ever previews.
            </p>
            <p className="mt-4 max-w-xl text-sm text-white/45">
              Multi-tenant by design: row-level security, every component scoped to your <code>owner_id</code>. Your vault is yours alone.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#0c0c16] p-8">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/80">Blocked on sight</p>
            <ul className="space-y-3">
              {BLOCKED.map((b) => (
                <li key={b} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/40 px-4 py-3 font-mono text-sm text-white/80">
                  <span className="text-rose-400">✕</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- PRICING ---------- */}
      <section id="pricing" className="relative z-10 border-y border-white/10 bg-[#07070d] py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <SectionLabel>Plans</SectionLabel>
          <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Start free. Forge faster when you&apos;re ready.</h2>
          <div className="mt-16 flex flex-wrap justify-center gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                per: 'forever',
                blurb: 'Build your vault',
                feats: ['Unlimited saves', 'Live previews & sandbox', 'ZIP & folder export'],
                note: '',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$19',
                per: '/mo',
                blurb: 'Plug in your AI',
                feats: ['Everything in Free', 'MCP server for AI agents', 'Unlimited connection tokens', 'Priority support'],
                note: '',
                highlight: true,
              },
              {
                name: 'Team',
                price: '$49',
                per: '/mo',
                blurb: 'Share the forge',
                feats: ['Everything in Pro', 'Shared team vault', 'Up to 5 seats', 'Seat management'],
                note: '',
                highlight: false,
              },
            ].map((p) => (
              <GlassSurface key={p.name} width={320} height={360} borderRadius={26} backgroundOpacity={p.highlight ? 0.06 : 0} className="w-full max-w-[320px]">
                <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
                  {p.highlight && (
                    <span className="mb-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Most popular</span>
                  )}
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm text-white/50">{p.blurb}</p>
                  <p className="mt-4 text-4xl font-extrabold">
                    {p.price}
                    <span className="text-base font-medium text-white/50">{p.per}</span>
                  </p>
                  {p.note ? <p className="mt-1 text-xs text-violet-200/80">{p.note}</p> : <p className="mt-1 text-xs">&nbsp;</p>}
                  <ul className="mt-5 space-y-2 text-sm text-white/70">
                    {p.feats.map((f) => (
                      <li key={f}>✦ {f}</li>
                    ))}
                  </ul>
                </div>
              </GlassSurface>
            ))}
          </div>
          <p className="mt-8 text-xs text-white/45">
            Founding offer: lifetime Pro for <strong className="text-white/80">$199</strong>, first 100 members. MCP access is a Pro feature.
          </p>
        </div>
      </section>

      {/* ---------- CTA (Animated Pattern kana backdrop) ---------- */}
      <section id="start" className="relative z-10 overflow-hidden px-6 py-28 text-center">
        <div className="absolute inset-0 overflow-hidden opacity-[0.6]">
          <AnimatedPattern />
        </div>
        {/* Soft dark plate behind the heading for readability, plus a gentle fade
            at the very bottom for the footer — but the matrix stays visible
            across the middle and lower section instead of crushing to black. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_52%_44%_at_50%_42%,_rgba(5,5,10,0.74)_0%,_transparent_70%),linear-gradient(to_bottom,_transparent_74%,_#05050a_100%)]" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
          <KineticText text="Forge faster." className="justify-center text-5xl font-light tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] sm:text-6xl" />
          <p className="mt-6 max-w-xl text-white/80">
            Build the library once. Preview everything live. Then let your AI agent pull from it on
            demand — no more rebuilding the same component twice.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <AnimatedButton label="Start your vault" onClick={startVault} />
            <a href={PROD_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 bg-black/30 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-black/50">
              Visit SnapforgeUI.com →
            </a>
          </div>
        </div>
        <footer className="relative z-10 mx-auto mt-32 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/55 sm:flex-row">
          <span>© {new Date().getFullYear()} SnapForge UI</span>
          <span className="font-mono">Built entirely from vault components ✦</span>
        </footer>
      </section>
    </div>
  );
}

function ShowcaseCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.02] p-10">
      <div className="flex min-h-[280px] items-center justify-center">{children}</div>
      <span className="font-mono text-xs text-white/45">{label}</span>
    </div>
  );
}
