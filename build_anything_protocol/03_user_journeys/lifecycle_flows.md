# Lifecycle Flows

These are workflow states (not UI click-throughs).

## Capturing a New Component

1. Operator signs in (single-owner auth).
2. Operator pastes a snippet.
3. System runs the **ingestion pipeline** (pure): detect framework, infer name,
   detect dependencies, classify into category/subcategory/tags.
4. System runs the **sanitization decision** (pure) on the source.
5. If the decision is *allowed*, the component is persisted and a sandboxed live
   preview is rendered.
6. If the decision is *blocked* or *invalid*, the component is not rendered or
   exported; the operator is shown why. (The raw source may still be stored in a
   non-renderable state for review — storage is not rendering.)

## Previewing Safely

1. A component with an *allowed* sanitization outcome is selected or appears in
   the gallery.
2. System renders it **only inside a sandboxed iframe** (Sandpack), never in the
   host tree.
3. The preview cannot reach the host page, session, or other components,
   regardless of what the snippet attempts.

## Finding a Component Later

1. Operator opens the gallery, grouped by the taxonomy.
2. Operator browses a category/subcategory, or searches by name/tag/framework.
3. System returns matches; selecting one shows its sandboxed preview and source.

## Exporting a Bundle

1. Operator multi-selects components.
2. System verifies each selected component passed the sanitization gate.
3. System builds a framework-appropriate bundle (React files, or HTML+CSS) for
   only the *allowed* components.
4. System produces a single zip for download.

## Recovering From a Bad Paste

1. Operator pastes something malformed or hostile.
2. Ingestion does not crash: classification falls back to a safe default; the
   sanitization decision returns *blocked* or *invalid*.
3. The snippet never renders in the host page and never enters an export bundle.
4. Operator sees the outcome and can edit, re-paste, or discard.
