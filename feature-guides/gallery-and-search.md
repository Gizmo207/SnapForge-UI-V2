# Feature Guide: Gallery & Search

Owner domain: **Component Vault** (storage/retrieval). The gallery is UI that
*displays* and *collects intent* — it owns no decisions
([`../build_anything_protocol/08_governance/decision_ownership.md`](../build_anything_protocol/08_governance/decision_ownership.md)).

## What it does

Lets the operator browse stored Components grouped by the taxonomy and search the
vault by name, framework, category, subcategory, and tags.

## Browse

- Components are grouped by `category` → `subcategory` (the taxonomy owned by
  Ingestion). The UI renders these groups; it never invents categories.
- Each card shows the inferred `name`, `framework`, `tags`, `dependencies`, and a
  sandboxed thumbnail preview (for `allowed` Components) or a "blocked" state
  otherwise.

## Search

- Query matches against `name`, `framework`, `category`, `subcategory`, and
  `tags`.
- Search runs against the Supabase/Postgres vault (server-side); results are the
  matching Components with the same card treatment as browse.

## Rules

- **UI displays classification; it does not decide it.** Category/subcategory/tags
  come from the persisted Ingestion result.
- **Previews are still gated.** A card preview is a sandboxed preview of an
  `allowed` Component — the gallery does not bypass the gate to show thumbnails.
- **Auth-gated.** The gallery is owner-only; default-deny without a verified
  session.

## Notes

- Sorting/filtering by framework or tag is pure UI over persisted fields.
- Large vaults: paginate or virtualize server-side; this does not change any
  ownership boundary.
