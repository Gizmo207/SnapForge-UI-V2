-- SnapForge UI v2 — Component Vault schema (control plane)
-- Single-user vault: no tenancy. Render/export authority lives in
-- sanitization_outcome, never in row existence.

create table if not exists components (
  component_id          uuid primary key default gen_random_uuid(),
  owner_id              text not null,
  name                  text not null,
  framework             text not null check (framework in ('react', 'html')),
  source                text not null,
  -- Present ONLY when sanitization_outcome = 'allowed'. Enforced below.
  sanitized_artifact    text,
  sanitization_outcome  text not null check (sanitization_outcome in ('allowed', 'blocked', 'invalid')),
  category              text not null,
  subcategory           text not null,
  tags                  text[] not null default '{}',
  dependencies          text[] not null default '{}',
  html_source           text,
  css_source            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Data-model invariant: an artifact may exist only for allowed components.
  constraint artifact_requires_allowed
    check (sanitized_artifact is null or sanitization_outcome = 'allowed')
);

create index if not exists components_owner_idx on components (owner_id);
create index if not exists components_taxonomy_idx on components (owner_id, category, subcategory);
create index if not exists components_tags_idx on components using gin (tags);

-- Row Level Security: the vault is reachable only for its owner.
alter table components enable row level security;

-- Policy assumes the authenticated principal's id is exposed via the JWT/session.
-- Adjust the owner predicate to match the Auth.js -> Postgres identity wiring.
create policy components_owner_only on components
  for all
  using (owner_id = current_setting('request.owner_id', true))
  with check (owner_id = current_setting('request.owner_id', true));
