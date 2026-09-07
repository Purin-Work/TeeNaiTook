# REST API

Base prefix: `/api`. Swagger UI: `/api/docs`. OpenAPI JSON: `/api/docs-json`.

## Public routes

| Method | Path                            | Description                                                |
| ------ | ------------------------------- | ---------------------------------------------------------- |
| GET    | `/health`                       | API/database state and UTC timestamp; 503 when unavailable |
| GET    | `/products`                     | Search/filter/sort/paginate current products               |
| GET    | `/products/:slug`               | Canonical details, current summary and offers              |
| GET    | `/products/:slug/offers`        | Active retailer offers, ordered for comparison             |
| GET    | `/products/:slug/price-history` | Bangkok daily history and range statistics                 |
| GET    | `/retailers`                    | Active retailer identities                                 |
| GET    | `/categories`                   | Supported categories                                       |
| GET    | `/brands`                       | Active brands, optionally filtered by `category`           |

`POST /products/:slug/view` increments an anonymous page-view total and returns `{ "recorded": true }` with HTTP 200. Missing, archived or excluded-dataset products return 404. The browser deduplicates within a tab; totals are approximate and share the public API rate limit.

Product query parameters: `q`, `category=CPU|GPU|RAM|SSD`, `brand`, `retailer=jib|advice|ihavecpu`, `inStock=true|false`, `minPrice`, `maxPrice`, `sort=price_asc|price_drop|updated|name|popular`, `page=1`, `limit=20` (maximum 100).

`q` is trimmed, whitespace-normalized and matched case-insensitively by token across name, brand and model. SQL wildcard characters are escaped. The retailer filter requires that the product be tracked at that active retailer; displayed minimum remains the best valid offer across all its stores.

```http
GET /api/products?q=9800x3d&category=CPU&page=1&limit=20
```

```json
{
  "data": [
    {
      "id": "a-uuid",
      "name": "AMD Ryzen 7 9800X3D",
      "slug": "amd-ryzen-7-9800x3d",
      "brand": "AMD",
      "category": "CPU",
      "modelNumber": "100-100001084WOF",
      "minimumPrice": "17490.00",
      "cheapestRetailer": "Advice",
      "retailerCount": 3,
      "inStock": true,
      "lastUpdated": "2026-09-06T12:00:00.000Z",
      "referencePrice": "18534.29",
      "priceChange": -5.6,
      "isDemo": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "isDemo": true }
}
```

Illustrative **demo** response. Monetary fields are strings, or `null` when there is no eligible price. Admin Prisma decimal serialization may omit trailing zeros; it remains a decimal string. Do not treat an unknown price as zero.

History query: `range=7d|30d|90d|all`, `mode=lowest|retailers`. The result includes `points[{day,retailer,price}]`, `bucketDays`, `summary{low,average,high,days}`, `trackedLow` and `priceStatus{label,percentile}`. Summaries always describe daily market minima, including in retailer mode. Failed, partial, unknown-stock and out-of-stock observations never enter the history minimum.

## Authentication

`POST /auth/login` with `{email,password}` and an allowed `Origin` sets `tnt_session`. It returns public user identity only. `GET /auth/me` checks the cookie against the signed token and current admin record. `POST /auth/logout` clears the cookie. There is no public registration.

Cookies: HTTP-only, host-only, path `/api`, SameSite Lax, Secure in production. Tokens contain subject/role plus standard expiry/audience/issuer claims; they are never put in localStorage. Admin writes require an exact allowed origin; the cron route uses a separate secret.

## Admin routes

| Method      | Path                        | Description                                     |
| ----------- | --------------------------- | ----------------------------------------------- |
| GET         | `/admin/dashboard`          | Product/source/snapshot and job metrics         |
| GET / POST  | `/admin/products`           | Paginated listing / create canonical product    |
| GET / PATCH | `/admin/products/:id`       | Details with sources / edit or archive          |
| GET         | `/admin/retailers`          | All supported retailers                         |
| PATCH       | `/admin/retailers/:id`      | Set `isActive`                                  |
| GET / POST  | `/admin/sources`            | Paginated source list / manual URL mapping      |
| PATCH       | `/admin/sources/:id`        | Edit URL or activate/deactivate                 |
| POST        | `/admin/sources/:id/scrape` | 202 with single-source job                      |
| GET / POST  | `/admin/scrape-jobs`        | Paginated jobs / start full manual job          |
| GET         | `/admin/scrape-jobs/:id`    | Job with paginated source logs                  |
| POST        | `/internal/scrape`          | 202 scheduled trigger, requires `x-cron-secret` |

Admin product/source list accepts `q`, `page`, `limit`. Job lists and nested logs accept `page`, `limit`. IDs must be UUIDs. One mapping per product/retailer is enforced in the database. Demo mappings are read-only and cannot be converted into live URLs.

## Errors

```json
{
  "error": {
    "code": "INVALID_RETAILER_URL",
    "message": "URL ไม่ตรงกับร้านค้าที่เลือก หรือไม่ใช่หน้าสินค้าสาธารณะ"
  },
  "timestamp": "2026-09-06T12:00:00.000Z"
}
```

Common statuses: validation/URL 400, unauthorized 401, origin 403, missing 404, duplicate/overlap 409, scraper validation 422, rate limit 429, dependency unavailable 503. Job failures are returned through job/log state, not fabricated successful HTTP scrape data. Generic internal errors omit stack traces, SQL and connection details.
