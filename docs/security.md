# Security notes

## Authentication and authorization

- Passwords use bcrypt at cost 12; input is bounded to bcrypt's effective length in the seed. Missing-user login performs a dummy hash comparison and returns the same error as a wrong password.
- JWT verification pins HS256, audience, issuer and expiry, then checks the current database user/ADMIN role.
- The session cookie is HTTP-only, host-only, SameSite Lax, and Secure in production; no browser localStorage token.
- All admin mutations and login/logout enforce an exact `Origin` allowlist. A cron secret is independent from the session key and compared with `timingSafeEqual`.
- Login and public request rates are limited. Configure trusted proxy hops accurately; limits are per process in the MVP.
- Logout clears the cookie; tokens remain cryptographically valid until expiry. Use short lifetimes and signing-key rotation when revocation is necessary.

## SSRF and retailer access

Only exact explicitly approved hosts for the selected retailer are allowed. HTTPS, default port, no credentials, no sensitive query tokens, no account/checkout/order/private API paths. Host suffix tricks and numeric/local IP URLs are rejected.

DNS must resolve exclusively to publicly routable addresses. Private, loopback, link-local, multicast, reserved and IPv4-mapped private addresses are rejected. The checked address is pinned to the HTTPS socket's lookup callback while preserving normal TLS hostname verification. Every redirect is revalidated; at most three redirects are followed. DNS and network attempts have timers. HTTP content type, compression policy and maximum bytes are enforced before parsing arbitrary data.

The scraper does not evade restrictions. 401/403/429 and challenge-page titles produce blocked status. No authentication bypass, headless browser, browser cookie reuse, proxy rotation, private endpoints or bulk catalogue crawl. Selector fallback must be validated on permitted public product pages before enabling it.

## Input, data and logging

Global DTO validation transforms known fields and rejects extra fields. JSON bodies are capped at 64KB. Prisma writes and raw read queries use parameter bindings. Search wildcards are escaped. Unrecognized errors return a generic public error rather than SQL or stack traces. Helmet and explicit CORS origins are configured.

Product descriptions are plain text; React escapes rendered data. Scraped HTML is never rendered, stored in the database or included in logs. Logs omit cookies, passwords, JWTs, connection URLs and cron secrets. Seed scripts preserve existing credentials and do not print them.

Production needs HTTPS on the Node host, platform secret storage, database TLS, backups and operator review of retailer access policies. These operating concerns are separate from local code checks.
