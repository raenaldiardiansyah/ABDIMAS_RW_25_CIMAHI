# Ubuntu VPS Backend Deploy

Target topology:

- Vercel serves the frontend from `apps/web`.
- Ubuntu VPS serves the Hono API only.
- Nginx exposes the API at `https://api.example.com`.
- Vercel rewrites `/api/platform/*` to `BACKEND_URL`.

## 1. VPS Packages

```bash
sudo apt update
sudo apt install -y curl git nginx ufw certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

## 2. App Directory

```bash
sudo mkdir -p /var/www/abdimas-rw
sudo chown -R "$USER":"$USER" /var/www/abdimas-rw
cd /var/www/abdimas-rw
git clone <repo-url> .
```

## 3. Backend Environment

Use `deploy/vps-backend.env.example` as the VPS `.env` template.

Required production values:

```bash
NODE_ENV=production
PORT=4000
BACKEND_URL=https://api.example.com
APP_URL=https://app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
BETTER_AUTH_URL=https://app.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://app.example.com
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/abdimas
BETTER_AUTH_SECRET=...
NIK_ENCRYPTION_KEY_BASE64=...
NIK_HASH_PEPPER=...
ADMIN_EMAILS=admin@example.com
```

Keep `BETTER_AUTH_SECRET`, `DATABASE_URL`, `NIK_ENCRYPTION_KEY_BASE64`, and `NIK_HASH_PEPPER` aligned with Vercel.

## 4. Build Backend

```bash
pnpm install --frozen-lockfile
pnpm build:backend
pnpm db:migrate
```

The frontend build is handled by Vercel, not by the VPS.

## 5. PM2

```bash
pm2 start deploy/ecosystem.production.cjs
pm2 save
pm2 startup systemd
```

Check runtime status:

```bash
pm2 status
pm2 logs abdimas-backend
curl http://127.0.0.1:4000/health
```

## 6. Nginx

Use `deploy/nginx-abdimas.conf` as the API virtual host.

```bash
sudo cp deploy/nginx-abdimas.conf /etc/nginx/sites-available/abdimas-api
sudo ln -s /etc/nginx/sites-available/abdimas-api /etc/nginx/sites-enabled/abdimas-api
sudo nginx -t
sudo systemctl reload nginx
```

Issue TLS:

```bash
sudo certbot --nginx -d api.example.com
```

## 7. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw enable
```

Do not expose port `4000` publicly. It should stay behind Nginx.

## 8. Vercel Frontend

Follow `deploy/VERCEL_FRONTEND.md`.

Minimum Vercel env:

```bash
BACKEND_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
BETTER_AUTH_URL=https://app.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://app.example.com
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/abdimas
```

`NEXT_PUBLIC_BACKEND_URL` should stay empty unless the browser intentionally calls the VPS API directly.

## 9. Update Deploy

```bash
cd /var/www/abdimas-rw
git pull --ff-only
pnpm install --frozen-lockfile
pnpm build:backend
pnpm db:migrate
pm2 restart deploy/ecosystem.production.cjs --update-env
```

## 10. Smoke Checks

```bash
curl https://api.example.com/health
curl -I https://app.example.com
curl -I https://app.example.com/api/platform/health
```

## Code Review Notes

- Blocker: use the same auth and encryption secrets on Vercel and VPS.
- Blocker: keep port `4000` private; only Nginx should be public.
- Blocker: set `BACKEND_URL` on Vercel to the API domain, not localhost.
- Recommended: use managed PostgreSQL instead of hosting the database on the same VPS.
- Recommended: enable PM2 log rotation with `pm2 install pm2-logrotate`.
