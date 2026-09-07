# Environment reference

The root `.env` is development-only and ignored by Git. Production values belong in the hosting platform's secret manager. Do not upload `.env` or include it in a Docker build context.

| Variable                                            | Default / purpose                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                                          | `development`; production rejects demo mode and HTTP frontend origins                                  |
| `DATABASE_URL`                                      | Required PostgreSQL runtime URL; use Neon's pooled hostname in production                              |
| `DIRECT_URL`                                        | Migration connection; defaults to `DATABASE_URL` in Prisma config                                      |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Local Docker Compose database settings                                                                 |
| `PORT`                                              | API port, `4000`                                                                                       |
| `FRONTEND_URL`                                      | Comma-separated exact allowed origins; `http://localhost:3000` locally                                 |
| `API_INTERNAL_URL`                                  | Server-only Nest base URL including `/api`; also used by Next rewrites                                 |
| `NEXT_PUBLIC_API_URL`                               | Browser base path, `/api` recommended for same-origin cookies                                          |
| `NEXT_PUBLIC_SITE_URL`                              | Public site origin for canonical URLs and sitemap                                                      |
| `JWT_SECRET`                                        | Required, at least 32 characters; use a cryptographically random value                                 |
| `JWT_EXPIRES_IN`                                    | Seconds, default `3600`, bounded to 60–86400                                                           |
| `ADMIN_SEED_EMAIL`                                  | Initial admin email, required by seed                                                                  |
| `ADMIN_SEED_PASSWORD`                               | Initial password, 12–72 UTF-8 bytes; never echoed by setup/seed                                        |
| `CRON_SECRET`                                       | Required, at least 32 characters; sent in `x-cron-secret`                                              |
| `SAMPLE_DATA_ENABLED`                               | Default `false`; show clearly labeled seeded sample products while production security remains enabled |
| `DEMO_MODE`                                         | Template `true`; default if omitted `false`; must be `false` in production                             |
| `SCRAPER_ENABLED`                                   | `false`; controls actual outbound scraping, not the ability to inspect logged disabled results         |
| `SCRAPER_USER_AGENT`                                | Identifiable `TeeNaiTook/1.0 (+https://teenaitook.com/about)`; set an operator-controlled contact URL  |
| `SCRAPER_REQUEST_TIMEOUT_MS`                        | `12000`; DNS and each HTTP attempt are bounded                                                         |
| `SCRAPER_DELAY_MS`                                  | `2000`, minimum `500`; sequential worker delay between sources                                         |
| `SCRAPER_FRESHNESS_HOURS`                           | `12`; old successful observations cannot win cheapest                                                  |
| `SCRAPER_MAX_BODY_BYTES`                            | `2000000`; HTML response cap                                                                           |
| `SWAGGER_ENABLED`                                   | `true`; set `false` to disable API docs on an exposed deployment                                       |
| `TRUST_PROXY_HOPS`                                  | `0`; configure exact trusted proxy count for the host, never an unrestricted trust setting             |
| `PLAYWRIGHT_CHANNEL`                                | Test-only; use `chrome` for existing local Chrome                                                      |
| `E2E_BASE_URL`                                      | Test-only; defaults to `http://localhost:3000`                                                         |

All boolean values must be literal `true` or `false`. Changing API environment values requires a restart. `NEXT_PUBLIC_*` variables are embedded at web build time. `API_INTERNAL_URL` also affects build-time rewrite configuration, so rebuild after changing it.

Keep browser API requests same-origin through Next's `/api` rewrite. This allows a host-only HTTP-only cookie with `SameSite=Lax` without depending on cross-site cookie support. Direct cross-site API origins require a separate, reviewed cookie/CSRF configuration.
