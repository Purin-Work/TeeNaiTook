# Verification record

Verified locally on **7 September 2026, Asia/Bangkok**. These results describe commands actually executed, not an assumed CI or cloud result.

## Environment

- Windows, Node.js 24.18.0, pnpm 12.3.4.
- PostgreSQL 17 in an isolated local cluster, listening on `127.0.0.1:5433`. The existing PostgreSQL service on port 5432 was left unchanged.
- Next.js 16.3.4, NestJS 12.0.1, Prisma 7.10.0, TypeScript 7.0.2, Playwright 1.63.0.
- Chrome was used for browser tests with `PLAYWRIGHT_CHANNEL=chrome`.
- `DEMO_MODE=true`, `SCRAPER_ENABLED=false`. The frontend was tested using `next start` after a production build. The compiled API used development configuration so that demo data remained available; production configuration intentionally rejects demo mode.

## Executed checks

| Check                            | Result                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Passed; lockfile unchanged and pnpm supply-chain policy checks passed             |
| `pnpm db:generate`               | Prisma client generated successfully                                              |
| `pnpm db:migrate`                | All four SQL migrations applied; final verification found no pending migrations   |
| `pnpm db:seed`                   | Passed, including a repeat run preserving existing records                        |
| Database counts                  | 8 demo products, 24 demo sources, 2,184 demo snapshots across 91 calendar days    |
| `pnpm lint`                      | Oxlint and Prettier passed                                                        |
| `pnpm typecheck`                 | API and web passed, including generated Next route types                          |
| `pnpm test`                      | 16 backend unit tests passed                                                      |
| `pnpm test:e2e`                  | 7 integration cases passed; Node reports 8 tests including the parent test        |
| `pnpm build`                     | API TypeScript compilation and Next optimized build passed                        |
| `pnpm dev`                       | Both development servers started successfully                                     |
| `pnpm test:web`                  | All 3 browser flows passed against the compiled API and production frontend build |
| HTTP smoke checks                | API/database health, homepage and Swagger returned HTTP 200                       |
| Standalone Vercel-mode build     | Next production build passed without NestJS or PostgreSQL in the request path     |
| Standalone public browser flows  | 2 Playwright flows passed against `next start` on port 3100                       |

An initial offline frozen install lacked cached package metadata. Repeating the normal frozen install with registry access passed without changing the lockfile.

## Behavior exercised

Unit tests cover THB parsing, ambiguous variants, unknown/out-of-stock availability, JSON-LD and metadata parsing for all three adapters, stale-price exclusion, cheapest-price ties, price statistics, authentication, production configuration, URL/IP restrictions, redirect validation and bounded retries.

Integration tests use real PostgreSQL and the actual Nest application. Only the outbound retailer HTTP transport is replaced with an original synthetic fixture. They exercise search/filter/pagination, offer/history contracts, Bangkok calendar boundaries, authentication and origin protection, validation, duplicate source mappings, successful collection, failed collection preserving the last valid price, overlapping-job rejection, demo isolation, anonymous view counters, URL remapping and product archiving. Test-owned integration records are cleaned up.

The three browser flows cover:

1. Home, popular section, keyboard search suggestions, results, product comparison and chart ranges/retailer mode, with no uncaught page errors.
2. Shareable filters, empty results, mobile navigation and no horizontal overflow at 390px on the main public pages.
3. Admin login, product creation/editing, source mapping, a deliberately disabled scrape with a readable job log, archiving and logout.

Browser-created products are archived after testing. Recorded disabled jobs remain inspectable in the admin interface. No active browser test products remained at final verification.

Four screenshots were captured from the running production frontend build and saved under [`screenshots/`](screenshots/). Desktop home and mobile product screenshots were visually inspected. Checks include keyboard interactions and semantic accessibility linting; this is not a full assistive-technology audit.

## Repository review

The source and documentation were searched for `TODO`, `FIXME`, `Hello World`, temporary mock APIs, localhost references and obvious hardcoded credentials. No unfinished implementation markers or temporary mock catalogue API remain. Localhost references are documented development defaults, configurable environment fallbacks or isolated test fixtures. Seed/setup credentials are generated, and `.env`, local database files, logs and test artifacts are excluded from Git and container contexts.

## Not verified externally

- **Live retailer pages:** no verified product-page mappings were supplied. No claim is made that current JIB, Advice or iHAVECPU templates were fetched or parsed successfully. Adapter success was verified with fixtures; blocked, changed or ambiguous pages fail visibly.
- **Docker execution:** Docker is unavailable in this workspace. The API runtime/migration Dockerfile, PostgreSQL Compose configuration and CI Docker build step are supplied, but no successful local image build or container run is claimed.
- **Hosting:** Vercel, Neon and a backend host were not provisioned or deployed. Configuration and a deployment guide are included; the GitHub Actions workflow has not been run on GitHub here.
- **Scale:** load, multi-replica rate limiting, long-duration worker recovery and production TLS/proxy topology require deployment-specific testing.

## This workspace

The app is available at `http://localhost:3000`, admin at `/admin/login`, and Swagger at `http://localhost:4000/api/docs`. Use `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` from the root `.env`; no password is printed in this report.

This machine uses a workspace-local pnpm installation. In a new PowerShell terminal at the repository root, make it available with:

```powershell
$env:Path = "$PWD\.tools\node_modules\.bin;" + $env:Path
```

If restarting after the local database has stopped, use the existing isolated cluster:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe' -D "$PWD\.local\pgdata" -l "$PWD\.local\postgres.out.log" -o '-p 5433 -h 127.0.0.1' start
```

Then use `pnpm dev` after stopping any previously running application servers on ports 3000/4000. For a fresh checkout on another machine, follow the portable setup in the README instead of these workspace-specific paths.

Demo observations retain their original timestamps; rerunning the seed does not fabricate new observations. Once older than the configured 12-hour freshness window they correctly stop winning current-price comparisons. Use a newly seeded disposable development database when replaying the fresh-price acceptance tests after that window.
