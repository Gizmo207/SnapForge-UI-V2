# Success Criteria

## Product success

- The owner can go from "I have a snippet on my clipboard" to "it is saved,
  classified, and previewing live in my gallery" in a single paste, with no
  manual tagging required.
- Stored components are findable later by browsing the taxonomy or searching by
  name, framework, category, or tag.
- A multi-select export produces a clean zip bundle that drops into another
  project without hand-editing.

## Safety success

- **The system is default-deny at the render/export boundary:** pasted code does
  not render in the host page and is never written to an export bundle until the
  deterministic sanitization decision returns *allowed*.
- The live preview executes only inside a **sandboxed iframe**, never in the host
  React tree.
- A malicious or malformed paste can, at worst, affect its own sandboxed preview
  — it cannot reach the host page, the session, or other components.

## Engineering success

- The ingestion pipeline (`detectFramework`, `inferName`, `detectDependencies`,
  `classify`, `sanitize`) is **pure functions**, isolated from I/O, and built
  **test-first against a fixture corpus** of real pasted snippets.
- Decisions (what framework, what category, allowed-to-render) live in one owner
  each and are not duplicated in UI or controllers.
- Files stay small and cohesive; responsibilities stay stable.

## Operational success

- Auth protects the single owner's vault; nothing is reachable unauthenticated.
- Failures in ingestion are diagnosable and never crash the gallery — a snippet
  that cannot be classified still lands in a safe fallback state.
- The fixture corpus is the regression anchor: v1's classification and the
  failure modes v1 had are encoded as tests.
