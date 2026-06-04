# Backend VPS Deploy

Target:
- Node.js + PM2
- Single instance

Required env:
- `DATABASE_URL`
- `PORT`
- `BACKEND_URL`
- `BETTER_AUTH_SECRET`
- `NIK_ENCRYPTION_KEY_BASE64`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL` (optional)

Server prerequisites:
- Node.js 20+
- pnpm 10+
- PM2 installed globally
- Reverse proxy in front of backend, forwarding `X-Forwarded-For`

Install:
```bash
pnpm install --frozen-lockfile
```

Build:
```bash
pnpm --filter @abdimas/backend build
```

Migrate:
```bash
pnpm --filter @abdimas/db db:migrate
```

Seed policy:
- Run admin seeding only for first bootstrap.
- Do not run seed scripts on every deploy.

Optional first bootstrap:
```bash
pnpm seed:admin-login
```

Start with PM2:
```bash
pm2 start apps/backend/ecosystem.config.cjs
pm2 save
```

Direct start without PM2:
```bash
pnpm --filter @abdimas/backend start
```

Restart after deploy:
```bash
pnpm --filter @abdimas/backend build
pm2 restart abdimas-backend
```

Health check:
```bash
curl http://127.0.0.1:4000/health
```

Authenticated smoke check:
- Send a request to one admin route with a valid session cookie.
- Example target: `GET /admin/verifications`

Reverse proxy assumptions:
- Terminate TLS at Nginx or Caddy.
- Forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.
- Keep backend bound to internal port only.

Notes:
- Backend now expects real runtime env vars. Do not rely on repo `.env` discovery in production.
- Current rate limit is in-memory only. It resets on restart and is not safe for multi-instance deployment.
- The runtime command uses `node --import tsx --experimental-specifier-resolution=node` so the compiled backend can resolve workspace TypeScript packages and local ESM imports consistently on VPS.
