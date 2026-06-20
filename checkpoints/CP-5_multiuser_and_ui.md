# CP-5 — Multi-user + real UI

**Date:** 2026-06-20
**Status:** Shipped. App is live on Vercel and backed by the live Supabase project.

## What changed

### Multi-user (scope change from CP-4's single-owner)
- Replaced the single-owner gate (`OWNER_ID` + `ownerAuthDecision`) with a pure
  multi-user identity decision (`viewerIdentity.ts`): any authenticated account
  is the owner of its own vault.
- `getCurrentUserId()` resolves the session user; all route handlers and queries
  scope by it, so users are fully isolated.
- No schema change was needed — every row was already keyed by `owner_id`.
- `OWNER_ID` env var is now unused and can be removed from the deployment.

### Real UI (uiverse.io-inspired)
- New dark, gradient design system (`globals.css`).
- **Landing page** (`Landing.tsx`): explains the product; renders a sign-in
  button per configured provider (via `getProviders`).
- **Vault app** (`VaultApp.tsx`): sticky top bar with brand, search, paste, and
  export; responsive component grid; empty state.
- **Component cards** (`ComponentCard.tsx`): framed preview stage, lazy-mounted
  live preview on hover, name, framework/category chips, tags, select control.
- **Paste modal** (`PasteModal.tsx`): real textarea flow, replacing the old
  `window.prompt()`.
- **Preview** (`PreviewSandbox.tsx`): HTML renders in a fully locked
  `<iframe sandbox="">` (instant, no script execution); React renders in
  Sandpack's sandboxed bundler. The gate is re-checked at this boundary.

## Verified

- 54 tests pass; typecheck clean; `next build` succeeds.
- Backend round-trip + the `artifact_requires_allowed` constraint verified live
  in CP-4.

## Known follow-ups / not done

- Design polish per the user's own direction (uiverse.io reference) — iterate on
  spacing, motion, card detail/expanded view.
- Preview performance for large vaults (virtualize; cache Sandpack bundles).
- Per-user RLS hardening (currently isolation is enforced in app code via the
  service-role client; consider Auth.js→Postgres JWT for DB-level RLS).
- Google provider is wired but not yet configured with credentials.
- Browser/e2e tests of the live preview and the multi-user isolation boundary.
