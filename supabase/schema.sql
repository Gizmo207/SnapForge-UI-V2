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

-- MCP personal access tokens. The server resolves a presented token to its
-- owner_id (service role), then scopes every vault query to that owner. Only the
-- SHA-256 hash is stored; the raw token is shown to the user once at creation.
create table if not exists api_tokens (
  id            uuid primary key default gen_random_uuid(),
  owner_id      text not null,
  token_hash    text not null unique,
  label         text not null default 'MCP token',
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create index if not exists api_tokens_owner_idx on api_tokens (owner_id);
create index if not exists api_tokens_hash_idx on api_tokens (token_hash);

-- Accessed only via the service role (bypasses RLS); enable RLS with no public
-- policy so the table is never readable with the anon key.
alter table api_tokens enable row level security;

-- Billing: one row per owner tracking plan + Stripe identifiers. No row = free.
-- Accessed via the service role; the MCP gate and checkout/portal read this.
create table if not exists subscriptions (
  owner_id                text primary key,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    text not null default 'free' check (plan in ('free','pro','team')),
  status                  text,
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);
create index if not exists subscriptions_customer_idx on subscriptions (stripe_customer_id);
alter table subscriptions enable row level security;

-- Owner profiles: the minimal record of who has signed in. Used to send the
-- welcome email exactly once (welcomed_at claims it) and to keep contact details
-- current for transactional email. Accessed via the service role only.
create table if not exists profiles (
  owner_id     text primary key,
  email        text,
  name         text,
  created_at   timestamptz not null default now(),
  welcomed_at  timestamptz
);
alter table profiles enable row level security;
