# Domain Map

This maps product capabilities to domain ownership.

## Domains

- **Identity & Access** — authenticates the single owner; gates all access.
- **Ingestion** — pure analysis of pasted source: framework, name, dependencies,
  classification. Owns the taxonomy.
- **Sanitization** — owns the render/export safety decision. This is the
  boundary domain; its outcome gates Preview and Export.
- **Component Vault** — durable storage and retrieval of components and their
  metadata; owns browse and search.
- **Preview** — renders *allowed* components inside a sandboxed iframe. Owns
  nothing that decides; it only presents what Sanitization allowed.
- **Export** — assembles bundles from *allowed* components.

## Ownership principle

Each capability belongs to exactly one domain. In particular:

- Only **Sanitization** decides whether code may render or export. Preview and
  Export consume that decision; they never re-derive or override it.
- Only **Ingestion** owns classification and the taxonomy. The UI displays it but
  does not invent categories.
- Only **Identity & Access** decides who may reach the vault.

## Pure vs I/O split

- **Pure (no I/O):** Ingestion, Sanitization. These are deterministic functions
  built test-first.
- **I/O / orchestration:** Identity & Access, Component Vault (persistence),
  Preview (iframe runtime), Export (zip assembly). Controllers orchestrate; they
  gather inputs and invoke pure decisions but never redefine them.
