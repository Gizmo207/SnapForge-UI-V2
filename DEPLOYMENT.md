# Deploying / Running SnapForge UI v2

## What is already done (by the build)

- ✅ App implemented, typechecked, builds, 54 tests pass.
- ✅ Supabase project **provisioned**: `snapforge-ui-v2`
  (ref `ojuzilqrhoaquxkedxpd`, region us-east-2, free tier).
- ✅ Schema applied and **verified live**: the `components` table exists and the
  `artifact_requires_allowed` CHECK constraint enforces the boundary invariant at
  the database layer (a blocked component cannot carry an artifact).

## What only you can do (accounts + secrets)

1. Provide the Supabase **service-role secret key** (you have it) as an env var.
2. Deploy (Vercel) or run locally.
3. Create at least one OAuth app (Google and/or GitHub) — the redirect URL must
   point at the final site URL, so this comes *after* the first deploy.
4. Sign in once, copy your owner id from the claim screen into `OWNER_ID`.

---

## Environment variables

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://ojuzilqrhoaquxkedxpd.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *the `sb_secret_…` key (keep secret; never commit)* |
| `NEXTAUTH_SECRET` | generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | your site URL (e.g. `https://snapforge-ui-v2.vercel.app`) or `http://localhost:3000` |
| `OWNER_ID` | set after first sign-in (claim screen shows it, e.g. `google:1082…`) |
| `GOOGLE_ID` / `GOOGLE_SECRET` | from a Google OAuth client (optional if using GitHub) |
| `GITHUB_ID` / `GITHUB_SECRET` | from a GitHub OAuth app (optional if using Google) |

At least one OAuth provider must be configured to sign in.

---

## Option A — Deploy on Vercel (recommended)

1. **Import the repo.** vercel.com → *Add New… → Project → Import Git Repository*
   → select `Gizmo207/SnapForge-UI-V2`. Pick the branch
   `claude/peaceful-bohr-irqq91` (or merge it to `main` first). Framework preset
   auto-detects **Next.js**.
2. **Add environment variables** (Project → Settings → Environment Variables):
   set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`. Leave
   `NEXTAUTH_URL`, `OWNER_ID`, and the OAuth vars for the next steps.
3. **Deploy.** You get a URL like `https://snapforge-ui-v2.vercel.app`.
4. **Set `NEXTAUTH_URL`** to that URL and redeploy.
5. **Create an OAuth app** (see below) using that URL's callback, then add the
   provider env vars and redeploy.
6. **Claim the vault.** Visit the site → *Sign in* → the claim screen shows your
   owner id → set `OWNER_ID` to that value → redeploy. You now own the vault.

> Tip: enabling Vercel's Git integration means future pushes to the branch
> auto-deploy.

## Option B — Run locally

```bash
git fetch origin claude/peaceful-bohr-irqq91
git checkout claude/peaceful-bohr-irqq91
npm install
cp .env.example .env.local      # then fill it in (see table above)
npm run dev                     # http://localhost:3000
```

Use `http://localhost:3000` for `NEXTAUTH_URL` and the OAuth callback host. Sign
in, copy your owner id from the claim screen into `OWNER_ID` in `.env.local`,
then restart `npm run dev`.

---

## Creating the OAuth app(s)

The callback path is `/api/auth/callback/<provider>`. Replace `<SITE>` with your
deployed URL or `http://localhost:3000`.

### Google
1. https://console.cloud.google.com/apis/credentials → *Create Credentials →
   OAuth client ID → Web application*.
2. **Authorized redirect URI:** `<SITE>/api/auth/callback/google`
3. Copy the client ID/secret into `GOOGLE_ID` / `GOOGLE_SECRET`.

### GitHub
1. https://github.com/settings/developers → *New OAuth App*.
2. **Homepage URL:** `<SITE>`
   **Authorization callback URL:** `<SITE>/api/auth/callback/github`
3. Copy the client ID and a generated client secret into `GITHUB_ID` /
   `GITHUB_SECRET`.

---

## Note on this build environment

The CI/agent container has restricted network egress (an allowlist), so it cannot
make outbound calls to Supabase or deploy to Vercel directly. That restriction is
specific to this sandbox — Vercel's build/runtime and your local machine reach
Supabase normally. The database itself was provisioned and verified through the
Supabase management API, which is why the schema and constraint checks above
succeeded.
