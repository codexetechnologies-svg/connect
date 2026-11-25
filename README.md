# Connect Pharma

The active local application is an Express HTML marketplace served from `web/`. This repository also contains a separate Next.js prototype.

`npm run dev` starts the Express app. The Vercel and Netlify deployment sections and `netlify.toml` target the separate Next.js prototype; they do not deploy the active Express app. Neither app should be treated as production-ready without verifying its own deployment and configuration.

## Production-readiness status

- Authentication uses one email/password sign-in for supplier, medical shop, and admin accounts. Public registration is limited to suppliers and medical shops; new accounts are activated after email verification. Admin accounts must be provisioned by an operator.
- The HTML app includes role-specific admin navigation, account lifecycle actions, plan management, private KYC review, and Cashfree checkout wiring. These workflows require the manual migration and provider configuration described in [Admin, billing, and KYC workflows](./docs/admin-workflows.md).
- `GET /api/health` reports database connectivity, missing admin workflow schema objects, and Cashfree/R2/Supabase Auth deletion configuration; it never returns credential values.
- Admin account deletion suspends access, removes linked Supabase Auth and private R2 KYC data, and preserves settled payment records without an account link. It requires migration 0003 plus server-only `SUPABASE_SERVICE_ROLE_KEY`; failed cleanup remains retryable.
- GST invoicing, automated recurring charges, and document malware scanning are not implemented. Do not launch live billing or KYC collection until operational policies and provider configuration are reviewed.
- `database/schema.sql` is a schema reference. The OTP index/attempt-count migration is in `database/migrations/0001_otp_verifications_index.sql`; review it and back up the database before applying. Migrations are never run automatically.

Production readiness is not complete. Review and back up the database before applying migration 0003, configure sandbox providers before exercising integrations, and review security, privacy, tax, and operational policies before production use.

The separate Next.js prototype uses PostgreSQL, a unique `SESSION_SECRET`, Resend, and Upstash. The active Express HTML app uses Supabase Auth instead; see [Authentication and account registration](./docs/auth-email-setup.md) for its setup. Never commit secrets.

## Local development and browser tests

Create `.env.local` using [.env.example](./.env.example). For the separate Next.js prototype, generate a unique `SESSION_SECRET` of at least 32 characters with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

```bash
npm run dev
npm run test:e2e
```

To preview the distributor and retailer portals locally without email authentication, run `npm run dev:preview` and open `http://localhost:4000/login.html`. The preview is restricted to loopback requests, read-only, and unavailable in production.

`npm run typecheck` runs the TypeScript check. Keep `.env.local` private and never reuse a local secret in production.

The `npm run dev` Express HTML app uses Supabase Auth for sign-in and registration. Public sign-up creates a pending PostgreSQL `users` row with the selected supplier or medical shop role; email verification automatically activates the account. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`), `PUBLIC_APP_URL`, `DATABASE_URL`, and both Upstash variables. Allow `${PUBLIC_APP_URL}/login.html?verified=1` in Supabase's Auth redirect URL settings, and apply `database/migrations/0003_admin_billing_kyc.sql` before enabling signup. Private supplier/admin APIs fail closed until authentication is configured. Public search and map APIs are rate-limited; `robots.txt` is only a crawler hint, not an access-control mechanism. When deployed behind a reverse proxy, set `TRUST_PROXY_HOPS` to the trusted proxy count so rate limits use client addresses correctly. For production, set `NODE_ENV=production` and enforce HTTPS at the Express host or trusted proxy; the app adds HSTS in production and marks auth cookies `Secure` unless it is explicitly running in development.

The Playwright tests start the development server when needed. Install its Chromium browser once if it is not already available:

```bash
npx playwright install chromium
```

Apply `database/migrations/0003_admin_billing_kyc.sql` to the production database before enabling registration if it has not already been applied. Provision admin accounts through a controlled operator workflow; public registration does not allow admin roles.

Catalogue imports accept CSV files with `medicine, composition, brand, pack, basePrice, stock` columns. Catalogue, enquiry, approval, and plan actions are still demo-only.

## Deploying to Vercel

This section is for the separate Next.js prototype; it is distinct from the Express HTML app used by `npm run dev`.

Use `npm run build` as the Vercel build command. No Clerk credentials are needed. Authentication secrets are read at runtime, so missing configuration will prevent authentication but will not block compilation.

In the Vercel project settings, add these environment variables for every deployment environment you use:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Use the production PostgreSQL connection string. URL-encode reserved characters in credentials. |
| `SESSION_SECRET` | Yes | Generate at least 32 random bytes; use a different secret per environment. |
| `RESEND_API_KEY` | Yes | Used for email verification and password reset messages. |
| `EMAIL_FROM` | Yes | A sender address verified with Resend. |
| `UPSTASH_REDIS_REST_URL` | Yes | Shared production rate limiting for sign-in and email requests. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Keep private. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | For the map | Restrict the browser key to your production site origin and the Maps JavaScript API. |

Apply `database/migrations/0002_password_auth.sql` before enabling the Next.js prototype's password-auth flow. After changing environment variables, redeploy; existing deployments do not pick up changed values.

## Deploying to Netlify

This section is for the separate Next.js prototype; it is distinct from the Express HTML app used by `npm run dev`.

Connect this repository to Netlify and use the settings in `netlify.toml`: `npm run build`, publish directory `.next`, and the Next.js plugin. Keep `output: 'standalone'` in `next.config.ts`; the configured Netlify plugin uses that build output. Do not configure this app as a static export.

Set these site environment variables in the Netlify UI for the deploy contexts you use, then redeploy:

| Variable | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | Yes | Generate at least 32 random bytes; use a different secret per environment. |
| `DATABASE_URL` | Yes | Use the production Supabase PostgreSQL connection string, not the local/test database. URL-encode reserved characters in credentials. |
| `RESEND_API_KEY` | Yes | Used for email verification and password reset messages. |
| `EMAIL_FROM` | Yes | A sender address verified with Resend. |
| `UPSTASH_REDIS_REST_URL` | Yes | Shared production rate limiting for sign-in and email requests. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Keep private. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | For the map | Restrict the browser key to your production site origin and the Maps JavaScript API. |

Apply `database/migrations/0002_password_auth.sql` before enabling the Next.js prototype's password-auth flow. Keep secrets in Netlify's environment settings; do not commit them or copy `.env.local` into the repository.

The development database setup does not provision production. Before deploying protected pages, create an approved admin `users` record. `database/schema.sql` is a reference with known schema drift; apply deliberate migrations rather than pushing the full reference schema.

After deployment, check `/api/health`. Its database check reports connection status, but the endpoint returns `503` until all readiness checks pass, including email, rate limiting, storage, and payments. Those integrations are not all implemented yet, so a `503` does not by itself mean the database connection failed.

## Google Maps setup

The supplier map uses the Google Maps JavaScript API. A local `.env.local` is provided; set your browser-restricted key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_browser_restricted_key
```

In [Google Cloud Console](https://console.cloud.google.com/google/maps-apis), select a project, enable the Maps JavaScript API, link an active billing account, and create a browser key. Restrict its website origins to `http://localhost:3000` and your deployed domain, and restrict the key to the Maps JavaScript API. Restart `npm run dev` after adding the key. Netlify deployments need the same variable in the site's environment settings.

Supplier coordinates in the current demo are city-level examples; replace them with verified business locations before production.
