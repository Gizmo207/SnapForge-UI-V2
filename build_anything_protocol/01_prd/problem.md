# Problem

A developer who collects UI snippets — from CodePen, blog posts, design systems,
AI generations, and their own past work — has nowhere durable to keep them. The
snippets live in scattered files, gists, and browser tabs. When the moment comes
to reuse one, the developer cannot find it, cannot remember which framework it
was, and cannot see what it looks like without pasting it into a throwaway
project first.

SnapForge UI v2 exists to make it possible to:

- Paste a React or HTML snippet and have it **immediately understood**
  (framework, name, dependencies, category) without manual tagging.
- **See it render live** the moment it lands, safely, without trusting the code.
- **Find it later** by browsing a categorized gallery or searching.
- **Take it out** as a clean, ready-to-drop-in zip bundle.

## What v1 got right, and what we are not repeating

v1 (`github.com/Gizmo207/SnapForge-UI`) proved the loop works: a custom parser
classified snippets into a taxonomy, and a hand-built preview engine rendered
them. But two subsystems were fragile and are explicitly being replaced:

- **The "sanitizer" was cosmetic, not safety.** v1's sanitizer only rewrote JSX
  ergonomics (`class` → `className`, boolean attrs, SVG camelCase). The *only*
  thing standing between pasted code and the host page was a naive substring
  blocklist (`<script`, `window.`, `document.`, `eval(`). That is trivially
  bypassed and is not a security boundary.
- **The preview engine was hand-rolled.** v1 built iframe `srcdoc` templates by
  hand and leaned on the blocklist above.

v2 keeps the product and treats *pasted code as untrusted input that must pass a
real gate before it can render or export* (see the boundary invariant in
`../README.md`).

## Out of scope (deferred on purpose)

- Multi-user accounts, sharing, teams, multi-tenancy.
- Server-side execution of pasted code.
- Payments, usage limits, metering.
- Acting as a general design tool, a Figma replacement, or a package registry.
