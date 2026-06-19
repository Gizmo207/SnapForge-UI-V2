# Feature Guide: Preview

Owner boundary: **Preview** (presents; never decides). It renders only what the
**Sanitization** gate marked `allowed`. Rules:
[`../build_anything_protocol/06_decision_rules/sanitization.md`](../build_anything_protocol/06_decision_rules/sanitization.md),
[`../build_anything_protocol/08_governance/invariant_enforcement.md`](../build_anything_protocol/08_governance/invariant_enforcement.md).

## What it does

Renders a component live so the operator can see it — **only inside a sandboxed
iframe**, never in the host React tree.

## The boundary (read first)

> Pasted code executes only inside the Sandpack sandboxed iframe.

This is the single most important rule of the feature. The host page must never
import, `eval`, `dangerouslySetInnerHTML`, or otherwise execute pasted source.
This is what v1 lacked: v1 built iframe `srcdoc` by hand and gated it with a
substring blocklist. v2 uses **Sandpack** as the isolation boundary and the
sanitization gate as the admission control.

## Flow

1. A Component is requested for preview.
2. Preview checks `sanitizationOutcome === 'allowed'`. If not, it renders a
   "blocked / cannot preview" state and **stops** — no rendering attempt.
3. For an `allowed` Component, Preview hands the sanitized artifact to Sandpack:
   - `react` → a Sandpack React template with the component as the entry.
   - `html` → an HTML template (cleaned markup + CSS).
4. Sandpack runs it in its sandboxed iframe. Nothing it does can reach the host
   page, the session, or other Components.

## Rules

- **Re-check the gate at this boundary.** Do not assume ingestion or persistence
  validated anything; confirm `allowed` here (`invariant_enforcement.md`).
- **Sandbox only.** No host-tree rendering for SSR, performance, or "just this
  case." That is an invariant violation.
- **Preview decides nothing about safety.** It consumes `sanitizationOutcome`; it
  never re-derives or overrides it.

## Notes

- iframe sandbox attributes should be as restrictive as the preview allows;
  Sandpack's bundling runs inside the sandbox.
- A failed/erroring preview is contained to its own iframe and surfaced as a
  preview error — it never crashes the gallery.
