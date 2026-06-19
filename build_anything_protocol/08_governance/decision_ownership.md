# Decision Ownership

## Core rule

Each decision belongs to **exactly one** owner. Other parts of the system may
supply inputs, but they do not redefine the decision.

## Ownership map (SnapForge v2)

| Decision | Owner | Consumers (inputs/outcomes only) |
| --- | --- | --- |
| May this code render or export? | **Sanitization** domain | Preview, Export |
| Framework / name / dependencies / classification | **Ingestion** domain | Vault, UI, Export |
| Is this the authenticated owner? | **Identity & Access** domain | every protected route |
| What goes in a bundle? | **Export** domain (gated by Sanitization) | UI |
| The taxonomy (categories/subcategories/tags) | **Ingestion** domain | UI (display only) |

## UI ownership rule

UI never owns decisions. The gallery may *display* classification, gate
outcomes, and dependency lists, and may *collect* the operator's paste and
selection intent — but it must contain no safety, classification, or export
rules.

## Controller ownership rule

Controllers orchestrate; they do not decide. A controller gathers inputs (the
pasted source, the session), invokes the authoritative pure decision, and routes
the outcome (allowed/blocked, react/html). It never re-derives or softens an
outcome.

## The non-negotiable

Only the Sanitization decision authorizes render/export. If any other layer
(Preview, Export, UI, a "helper") appears to be deciding safety, that is a
governance violation to be fixed, not a convenience to keep.

## When ownership is unclear

Do not implement it. Resolve ownership first, then proceed.
