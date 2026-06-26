# SnapForge Landing — Integration Guide

This folder is a **standalone Vite + React + TypeScript** build of the landing page.
Everything you need is here. Below is how to (A) run it as-is, or (B) port it into
your **Next.js 15 App Router** app as the home route — keeping auth / vault / MCP intact.

---

## File map

```
snapforge-landing/
├── src/
│   ├── App.tsx                      # the whole page (sections + copy)
│   ├── main.tsx                     # Vite entry (NOT needed for Next.js)
│   ├── index.css                    # globals: Tailwind import, marquee @theme,
│   │                                #   glass-surface, dot-field, lightfall, body
│   ├── lib/utils.ts                 # cn() helper (clsx + tailwind-merge)
│   └── components/vault/            # the 13 vault components (the important part)
│       ├── AnimatedPattern.tsx      # kana matrix bg          (styled-components)
│       ├── LightfallNeon.tsx        # falling neon streaks    (ogl / WebGL)
│       ├── TwoPiWave.tsx            # rainbow dot wave wall    (canvas 2d)
│       ├── KineticText.tsx          # hover-weight headline    (Tailwind only)
│       ├── Marquee.tsx              # scrolling strip          (Tailwind only)
│       ├── GlassSurface.tsx         # glass panels             (SVG filter + CSS)
│       ├── GradientCard.tsx         # feature cards            (styled-components)
│       ├── Card3D.tsx               # 3D tilt card             (styled-components)
│       ├── AnimatedToggle.tsx       # red rocker switch        (styled-components)
│       ├── GamepadCheckbox.tsx      # power-pad checkbox       (styled-components)
│       ├── AnimatedLoader.tsx       # molten loader            (styled-components)
│       ├── LiquidLoader.tsx         # liquid bar loader        (styled-components)
│       └── AnimatedButton.tsx       # gradient CTA button      (styled-components)
└── index.html, vite.config.ts, tsconfig*.json, package.json
```

> Note: the `lightningcss-*`, `@tailwindcss/oxide-*`, and the `rollup` override in
> `package.json` are **Vite/Windows-only build fixes**. You do NOT need any of them in Next.js.

---

## Runtime dependencies that actually matter

```bash
npm i styled-components ogl clsx tailwind-merge
npm i -D @types/styled-components   # if your TS setup needs it
```

- **styled-components** — used by 8 components (cards, toggle, checkbox, loaders, button, kana bg)
- **ogl** — used only by `LightfallNeon` (the hero streaks)
- **clsx + tailwind-merge** — the `cn()` helper. You likely already have this from shadcn —
  if so, delete `src/lib/utils.ts` and point imports at your existing `@/lib/utils`.
- **Tailwind** — `KineticText` and `Marquee` use Tailwind utility classes, and the page
  layout (`App.tsx`) is all Tailwind. See the Tailwind note below.

---

## Option A — run standalone (no porting)

```bash
cd snapforge-landing
npm install
npm run dev      # http://localhost:5173 (or the port shown)
npm run build    # production build in dist/
```

Deploy `dist/` as its own Vercel/static project. Your main app stays untouched.

---

## Option B — port into your Next.js 15 app (recommended)

### 1. Copy the components
Copy `src/components/vault/` into your app (e.g. `components/vault/`).

**Add `"use client"` as the first line of every file in `vault/`.** They all use
hooks, browser APIs, or styled-components, so they must be Client Components.
(`KineticText` and `Marquee` are technically pure, but marking them client is harmless
and keeps the folder consistent.)

### 2. styled-components SSR registry (one-time)
Next.js needs a registry so styled-components doesn't flash/mismatch on hydration.

`next.config.js`:
```js
module.exports = { compiler: { styledComponents: true } };
```

`lib/styled-registry.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({ children }: { children: React.ReactNode }) {
  const [sheet] = useState(() => new ServerStyleSheet());
  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });
  if (typeof window !== "undefined") return <>{children}</>;
  return <StyleSheetManager sheet={sheet.instance}>{children}</StyleSheetManager>;
}
```

Wrap `children` in your root `app/layout.tsx` with `<StyledComponentsRegistry>`.

### 3. The `cn` helper
Reuse your existing `@/lib/utils`. If you don't have one, copy `src/lib/utils.ts`.
Then in `KineticText.tsx` and `Marquee.tsx`, make sure the import path matches
(`@/lib/utils`). Your tsconfig `@/*` alias already points where you need it.

### 4. Global CSS
Open `src/index.css` and copy these blocks into your `app/globals.css`:
- the `@theme inline { ... marquee keyframes ... }` block (Tailwind v4) — **see Tailwind note**
- `.glass-surface*` rules (Glass Surface)
- `.dot-field-container` (TWO PI)
- `.lightfall-container` (Lightfall)

**Do NOT blindly copy the `html, body { ... }` block** — merge the bits you want
(dark `#05050a` background, font smoothing) so you don't stomp your existing globals.

### 5. The page
`App.tsx` is the entire page. Drop its JSX into your home route — e.g.
`app/page.tsx` (or a `(marketing)` route group). It has **no hooks**, so it can stay a
**Server Component**; the vault components it renders are the Client Components from step 1.
Just change the import paths from `./components/vault/...` to `@/components/vault/...`
and remove the Vite `main.tsx`/`index.html` (Next provides those).

### 6. Tailwind note
- This build uses **Tailwind v4** (`@import "tailwindcss"` + `@theme`).
- If your app is **Tailwind v4**: copy the `@theme` marquee block as-is.
- If your app is **Tailwind v3**: move the marquee keyframes/animation into
  `tailwind.config.js` instead:
  ```js
  theme: { extend: {
    animation: {
      marquee: "marquee var(--duration,40s) linear infinite",
      "marquee-vertical": "marquee-vertical var(--duration,40s) linear infinite",
    },
    keyframes: {
      marquee: { from: { transform: "translateX(0)" },
                 to: { transform: "translateX(calc(-100% - var(--gap,1rem)))" } },
      "marquee-vertical": { from: { transform: "translateY(0)" },
                 to: { transform: "translateY(calc(-100% - var(--gap,1rem)))" } },
    },
  }},
  ```
  Also note `Marquee.tsx`/`KineticText.tsx` use v4 arbitrary syntax like `gap-(--gap)` —
  in v3 rewrite those as `gap-[var(--gap)]`.

---

## Gotchas / behavior notes

- **`LightfallNeon` and `TwoPiWave` attach `mousemove`/`pointermove` listeners** that
  react across the section. They self-clean on unmount. Both are WebGL/canvas — Client only.
- **`GamepadCheckbox` uses a hardcoded `id="power-toggle"`** — fine as a single instance.
  If you render more than one, parametrize the id to avoid `<label htmlFor>` collisions.
- **Content is parametrized**: `GradientCard`, `Card3D`, `AnimatedButton`, `KineticText`,
  `LiquidLoader` take props (title/description/label/text/etc.) — all the SnapForge copy
  lives in `App.tsx`, not baked into the components.
- The page assumes a **dark background** (`#05050a`). Set that on the route or body.

---

## Component → dependency quick reference

| Component        | Deps              | Client? |
|------------------|-------------------|---------|
| AnimatedPattern  | styled-components | yes     |
| LightfallNeon    | ogl               | yes     |
| TwoPiWave        | — (canvas)        | yes     |
| GlassSurface     | — (SVG/CSS)       | yes     |
| KineticText      | cn / Tailwind     | ok either |
| Marquee          | cn / Tailwind     | ok either |
| GradientCard     | styled-components | yes     |
| Card3D           | styled-components | yes     |
| AnimatedToggle   | styled-components | yes     |
| GamepadCheckbox  | styled-components | yes     |
| AnimatedLoader   | styled-components | yes     |
| LiquidLoader     | styled-components | yes     |
| AnimatedButton   | styled-components | yes     |
```
