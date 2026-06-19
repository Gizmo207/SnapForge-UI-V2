# Secondary Actors

These actors are not accounts and never sign in. They shape requirements.

## The Operator's Future Self

- Wants to return after months and still find a component by browsing or
  searching, relying on classification and names that were inferred at capture.
- Wants stored components to remain renderable and exportable even as the app
  evolves (see evolution rules in `../08_governance/evolution_and_migration.md`).

## The Export Consumer (downstream project)

- Receives exported zip bundles and expects them to be clean: correct file
  layout per framework, dependencies discoverable, no app-internal artifacts.
- Never interacts with the vault directly — the bundle is the entire contract.

## The Adversarial Paste

Not a person, but a first-class actor in the threat model: any pasted snippet is
treated as potentially hostile input.

- Must be assumed to attempt to break out of preview, reach the host page, read
  the session, or persist something harmful.
- The system's job is to make sure its blast radius is confined to its own
  sandboxed preview and that it cannot pass the render/export gate unsafely.
