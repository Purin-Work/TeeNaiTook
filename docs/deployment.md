# Deployment: Vercel + Node host + Neon

These are deployment-ready files and instructions. No account, domain registration or cloud deployment is included in local verification.

## Portfolio demo on Vercel (no backend required)

The standalone product page includes separate direct-store and Shopee comparisons for Advice, JIB and iHAVECPU. Shopee listing prices and voucher breakdowns are synthetic portfolio data; the UI labels the resulting checkout total as an estimate.

Use this mode when you want a stable public link for a portfolio review. It provides the complete public experience—homepage, autocomplete, category-aware brand filters, price filters, product comparison and 7/30/90/all history charts—using clearly labeled synthetic data. It makes no outbound retailer requests and needs no database, credentials or paid backend.

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel choose **Add New → Project** and import the repository.
3. Set **Root Directory** to `apps/web`. Keep the detected Next.js framework and commands from `vercel.json`.
4. Deploy. When Vercel is detected and `API_INTERNAL_URL` is absent, standalone demo mode activates automatically.
5. Optionally set `NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app` to your stable production or custom domain and redeploy. When omitted, the app uses Vercel's system production URL for metadata.

The `/api` Route Handler is part of the Next deployment and returns the demo catalogue at runtime. The Admin URL displays a read-only mode explanation because mutations and scraping need the full backend. Demo product links to retailers stay disabled so sample prices cannot be mistaken for live offers.

To connect the full backend later, configure `API_INTERNAL_URL` to the hosted Nest API including `/api` and configure the remaining production variables below. You may set `NEXT_PUBLIC_STANDALONE_DEMO=true|false` explicitly when you need to override automatic detection.

The rest of this guide describes the full production deployment.

## 1. Create a production database

Use a separate Neon project/branch/database from the demo. Set `DEMO_MODE=false`. Use the pooled connection string for `DATABASE_URL` and the direct connection for `DIRECT_URL`; keep Neon's TLS parameters. The runtime uses `PrismaPg` with a maximum of ten connections. Prisma CLI reads `DIRECT_URL` from `prisma.config.ts`.

Never set `rejectUnauthorized=false` or disable TLS verification. Connection credentials belong only on the backend/migration host, never in `NEXT_PUBLIC_*` variables. See the [Neon Prisma guide](https://neon.com/docs/guides/prisma) and [Prisma PostgreSQL configuration](https://www.prisma.io/docs/orm/overview/databases/postgresql).

## 2. Build and migrate the backend

Run from the repository root:

```bash
docker build -f docker/api.Dockerfile --target migration -t teenaitook-migration .
docker build -f docker/api.Dockerfile -t teenaitook-api .
```

Configure production variables on the deployment host, using `.env.example` as a variable checklist. At minimum:

```dotenv
NODE_ENV=production
DEMO_MODE=false
SCRAPER_ENABLED=false
PORT=4000
FRONTEND_URL=https://teenaitook.com
SWAGGER_ENABLED=false
TRUST_PROXY_HOPS=1
```

Supply real random `JWT_SECRET` and `CRON_SECRET`, Neon `DATABASE_URL`/`DIRECT_URL`, and first-admin seed credentials through the secret manager. The proxy-hop value is an example: configure the actual topology, not a blanket trust setting.

Run the migration image as a release job with production secrets. With a protected environment file outside the repository/build context:

```bash
docker run --rm --env-file /secure/teenaitook.env teenaitook-migration
docker run --rm --env-file /secure/teenaitook.env teenaitook-migration pnpm db:seed
docker run --name teenaitook-api --restart unless-stopped --env-file /secure/teenaitook.env -p 4000:4000 teenaitook-api
```

Production seed creates only the admin and retailer identities. Existing admin passwords are preserved. Run migrations once before the new application starts, not concurrently in every replica. On Railway/Render/Fly or another Docker host, use the equivalent release command/image and host-managed HTTPS. Health check path: `/api/health`.

Start with one always-running API instance. The runtime image uses a non-root user. Keep the API behind HTTPS and a correctly configured reverse proxy; do not use a sleeping/serverless process to run the worker.

## 3. Deploy the frontend to Vercel

Import the monorepo and choose **`apps/web` as Root Directory** with the Next.js preset and Node.js 24. Make files outside the root directory available so the workspace lockfile and root tools are visible. The committed `apps/web/vercel.json` sets installation/build commands.

Set:

```dotenv
API_INTERNAL_URL=https://your-api-host.example/api
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://teenaitook.com
```

Use the actual backend URL in the first value. No database URL, admin seed password, JWT key or cron secret belongs on the web host. The `/api` rewrite proxies browser requests to the API, preserving same-origin session cookies. The API must allow the frontend's exact origin. Add a specific preview origin only if that preview is intended to have admin access; avoid wildcard origin matching.

Rebuild when changing `NEXT_PUBLIC_*` or rewrite target values. See [Vercel monorepo setup](https://vercel.com/docs/monorepos).

## 4. Configure real products and scheduling

Log into the production admin interface and create canonical products with precise model numbers. Map only verified public product pages on the selected retailer's allowlisted host. Review the retailer's public access policies. Use one-source tests, inspect parser/price/stock and the retailer product name, and enable full scraping only once mappings are verified.

Set `SCRAPER_ENABLED=true` on the backend to enable requests. The in-process Nest scheduler starts a job at 00:00, 06:00, 12:00 and 18:00 UTC. It intentionally skips automatic runs in demo mode.

An external scheduler can instead make:

```http
POST /api/internal/scrape
x-cron-secret: <secret from the scheduler's secret store>
```

This returns **202** with a job ID. The worker continues on the long-running backend, not inside the external scheduler. Avoid placing the secret in the URL. Simultaneous triggers receive 409 while a job holds the database lease.

## Operational checks

- Confirm `/api/health`, authenticated admin routes, and product URLs through the deployed frontend.
- Check TLS, cookie `Secure`/`HttpOnly`/`SameSite`, exact origin allowlist and forwarded-IP rate limits.
- Check the first live scrape against the retailer page; partial/blocked outcomes are expected and must remain visible.
- Monitor stale sources, failure rate and the last successful job. Keep database backups and migration history.
- Use a separate preview/demo database. Do not enable demo mode in production; startup validation rejects it.
- Before horizontal scaling, add a shared rate limiter and review job lease and shutdown behavior. Database uniqueness already prevents normal overlapping workers, but the application is intentionally sized for a single-node MVP.

Rollback application images independently from the database. Prefer backward-compatible additive migrations; restoring an old image does not undo schema changes.

## Guided backend deployment: Render + Neon

The committed `render.yaml` creates the NestJS web service in Render's Singapore region. It installs the workspace, generates Prisma Client, builds the API, runs committed migrations before each deploy, seeds the first administrator once, and checks `/api/health`. It intentionally prompts for database credentials, the frontend origin and administrator credentials instead of storing secrets in Git.

1. Create a Neon PostgreSQL project in the Singapore region. Copy its pooled connection string as `DATABASE_URL` and its direct connection string as `DIRECT_URL`.
2. Deploy the Vercel demo once to obtain its HTTPS URL.
3. In Render, choose **New > Blueprint**, connect this repository and apply `render.yaml`.
4. Supply `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL`, `ADMIN_SEED_EMAIL` and a 12-72 byte `ADMIN_SEED_PASSWORD` when prompted. Set `FRONTEND_URL` to the exact Vercel origin without a trailing slash.
5. Wait for `/api/health` on the assigned Render URL to return `status: ok`.
6. In Vercel, set `API_INTERNAL_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`, `NEXT_PUBLIC_API_URL=/api`, `NEXT_PUBLIC_SITE_URL` to the Vercel URL, and `NEXT_PUBLIC_STANDALONE_DEMO=false`. Redeploy Vercel.
7. Open `/admin/login` on the Vercel site and use the seeded administrator credentials.

The Blueprint uses Render's paid `starter` web plan because pre-deploy commands are required for safe database migrations. Keep `SCRAPER_ENABLED=false` until real public product URLs have been mapped and tested from the admin area.
