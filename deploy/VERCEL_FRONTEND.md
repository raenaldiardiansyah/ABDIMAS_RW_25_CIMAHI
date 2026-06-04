# Vercel Frontend Deploy

Target:
- `apps/web` runs on Vercel.
- Ubuntu VPS runs only the Hono backend API.
- Browser calls `/api/platform/*` on Vercel.
- Next.js rewrites `/api/platform/*` to `BACKEND_URL`, for example `https://api.example.com`.

## Recommended Vercel Project Settings

Use one of these setups:

Option A, recommended:
- Import the GitHub repo into Vercel.
- Root Directory: `apps/web`
- Framework Preset: Next.js
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm build:web`

Option B, if Vercel has trouble with workspace packages:
- Root Directory: repository root
- Framework Preset: Other
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build:web`
- Output Directory: `apps/web/.next`

## Required Vercel Environment Variables

Use `deploy/vercel.env.example` as the template.

Important values:
- `BACKEND_URL=https://api.example.com`
- `BETTER_AUTH_URL=https://app.example.com`
- `NEXT_PUBLIC_APP_URL=https://app.example.com`
- `DATABASE_URL` must be available because web auth/server routes use the database.
- `BETTER_AUTH_SECRET`, `NIK_ENCRYPTION_KEY_BASE64`, and `NIK_HASH_PEPPER` must match the VPS backend.

Keep `NEXT_PUBLIC_BACKEND_URL` empty unless you intentionally want browser-direct API calls.

## Build Check Before Deploy

Run locally:

```bash
pnpm check-types
pnpm build
```

Current verified result:
- `pnpm build` passes.
- Existing warning: move `themeColor` and `colorScheme` from `metadata` to `viewport` later.

## API Flow

```txt
Browser
  -> https://app.example.com/api/platform/me
  -> Vercel Next rewrite
  -> https://api.example.com/me
  -> Hono backend on VPS
```

This avoids browser CORS issues because the browser calls the Vercel app origin.

## After Deploy Smoke Checks

```bash
curl -I https://app.example.com
curl https://api.example.com/health
```

Then test in browser:
- Sign in.
- Open warga dashboard.
- Submit one non-production test request.
- Check admin permohonan receives it.

## Code Review Notes

[BLOCKER] `BACKEND_URL` must be the public API domain in Vercel.
If it stays `http://localhost:4000`, Vercel serverless functions will call themselves or fail.

[BLOCKER] `BETTER_AUTH_SECRET` must match between Vercel and VPS.
If different, backend session validation can fail.

[SUGGESTION] Use a stable custom domain for Vercel before production.
Changing `BETTER_AUTH_URL` later can break callback/session assumptions.
