# Connect Pharma

A Netlify-first Next.js marketplace for wholesale medicine comparison and supplier discovery.

This workspace contains a Next.js marketplace prototype for wholesale medicine search, supplier catalogue management, enquiry handling, KYC review, revenue reporting, and plan selection. The interface remains partially demo-backed and is not production-ready.

## Production-readiness status

- Clerk is the active identity provider. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are required. Protected pages require a verified Clerk email that matches an approved PostgreSQL `users` record; server-side route layouts enforce account roles.
- Supabase OTP actions and setup instructions remain as legacy, unused code. They are not the current sign-in flow and must not be used to provision production accounts.
- `GET /api/health` reports database connectivity and whether Clerk, email delivery, rate limiting, private storage, and payments are configured; it does not return credential values.
- `POST /api/kyc/submit` returns `503`; private Cloudflare R2 document storage has not yet been connected. Cashfree payments and database-backed catalogue, enquiries, approvals, and subscriptions are also not implemented yet.
- `database/schema.sql` is a schema reference. The OTP index/attempt-count migration is in `database/migrations/0001_otp_verifications_index.sql`; review it and back up the database before applying. Migrations are never run automatically.

Production readiness is not complete. Do not collect KYC documents, take payments, or launch real marketplace operations until the remaining integrations and workflows are implemented and tested.

Configure Clerk and PostgreSQL in `.env.local` and the Netlify environment settings; never commit secrets. The Resend, Upstash, and Supabase OTP setup in [Email OTP and Resend setup](./docs/auth-email-setup.md) is legacy documentation and does not configure the active Clerk login.

## Local development and browser tests

Create `.env.local` using [.env.example](./.env.example). Generate a unique `SESSION_SECRET` of at least 32 characters with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

```bash
npm run dev
npm run test:e2e
```

`npm run typecheck` runs the TypeScript check. Keep `.env.local` private and never reuse a local secret in production.

The Playwright tests start the development server when needed. Install its Chromium browser once if it is not already available:

```bash
npx playwright install chromium
```

Before users can enter protected pages, configure Clerk and a reachable PostgreSQL database, and provision matching approved application accounts. Self-service sign-up is not yet connected to app-account/KYC provisioning.

Catalogue imports accept CSV files with `medicine, composition, brand, pack, basePrice, stock` columns. Catalogue, enquiry, approval, and plan actions are still demo-only.

## Deploying to Netlify

Connect this repository to Netlify and use the settings in `netlify.toml`: `npm run build`, publish directory `.next`, and the Next.js plugin. Keep `output: 'standalone'` in `next.config.ts`; the configured Netlify plugin uses that build output. Do not configure this app as a static export.

Set these site environment variables in the Netlify UI for the deploy contexts you use, then redeploy:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Use the production Clerk instance key. This is read during the build. |
| `CLERK_SECRET_KEY` | Yes | Keep server-side; never expose it with a `NEXT_PUBLIC_` prefix. |
| `DATABASE_URL` | Yes | Use the production Supabase PostgreSQL connection string, not the local/test database. URL-encode reserved characters in credentials. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | For the map | Restrict the browser key to your production site origin and the Maps JavaScript API. |

Use the production Clerk instance's configured domain. If it uses a custom frontend API domain, add that origin to the `script-src` and `frame-src` directives in `netlify.toml`. Keep secrets in Netlify's environment settings; do not commit them or copy `.env.local` into the repository.

The development database setup does not provision production. Before deploying protected pages, create the production auth schema and an approved `users` record whose email matches the user's verified primary Clerk email. `database/schema.sql` is a reference with known schema drift, not a production migration; review and apply only deliberate migrations.

After deployment, check `/api/health`. Its database check reports connection status, but the endpoint returns `503` until all readiness checks pass, including email, rate limiting, storage, and payments. Those integrations are not all implemented yet, so a `503` does not by itself mean the database connection failed.

## Google Maps setup

The supplier map uses the Google Maps JavaScript API. A local `.env.local` is provided; set your browser-restricted key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_browser_restricted_key
```

In [Google Cloud Console](https://console.cloud.google.com/google/maps-apis), select a project, enable the Maps JavaScript API, link an active billing account, and create a browser key. Restrict its website origins to `http://localhost:3000` and your deployed domain, and restrict the key to the Maps JavaScript API. Restart `npm run dev` after adding the key. Netlify deployments need the same variable in the site's environment settings.

Supplier coordinates in the current demo are city-level examples; replace them with verified business locations before production.
