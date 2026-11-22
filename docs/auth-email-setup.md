# Email OTP and Resend setup

> **Legacy:** The active application sign-in uses Clerk. The Supabase OTP implementation described below is not wired to the current `/login` page. Do not follow this guide to configure production authentication; use Clerk configuration and the PostgreSQL approved-account mapping described in the project README.

This application uses Supabase Auth to issue and verify email OTPs, Resend SMTP to deliver Supabase authentication messages, Upstash Redis for abuse controls, and the existing PostgreSQL application database for approved account roles.

## 1. Configure private environment variables

Set these in local `.env.local` and in Netlify site environment variables. Never add real values to `.env.example`, commit them, or expose them through `NEXT_PUBLIC_*`.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server-side Supabase publishable key; `SUPABASE_ANON_KEY` is accepted for older projects |
| `DATABASE_URL` or `NEON_DATABASE_URL` | PostgreSQL application database containing approved Connect Pharma users. Supabase and Neon connection URLs are supported; URL-encode reserved characters in credentials. |
| `SESSION_SECRET` | Random secret of at least 32 characters for signed app sessions |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `RESEND_API_KEY` | Resend API key; server-side only |
| `EMAIL_FROM` | `The Connect Pharma <noreply@connectpharma.in>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Local seed script only; never expose or use in client/deployment settings |
| `AUTH_SEED_ADMIN_EMAIL`, `AUTH_SEED_MEDICAL_SHOP_EMAIL`, `AUTH_SEED_SUPPLIER_EMAIL` | Distinct inboxes controlled by the local operator for seed accounts |
| `AUTH_SEED_CONFIRM` | Must be `LOCAL_TEST_USERS` to allow local/test seeding |

`RESEND_API_KEY` and the SMTP password in Supabase are the same Resend API key. Keep it only in server/deployment configuration and the Supabase SMTP password field.

OTP requests are limited to 3 per email in 15 minutes, 10 per Netlify client IP in one hour, and one request per email per 60 seconds. A shared Upstash budget also caps application-triggered messages at 100/day and 3,000 per rolling 30 days. Supabase has its own sending limits as well. This does not account for mail sent outside this application using the same Resend account.

For local development only, when both Upstash variables are absent, the application uses a process-local in-memory limiter with the same OTP limits and email budgets and prints a warning. This fallback is not shared across processes and is never enabled in production. If either Upstash variable is set, both must be valid; production always requires both.

## 1a. Local bootstrap and readiness checks

1. A local `.env.local` template is present in this workspace. In a new checkout, copy `.env.example` to `.env.local` and generate a random session secret with `node -p "require('node:crypto').randomBytes(32).toString('base64url')"`. Keep an existing valid secret to avoid invalidating sessions.
2. Fill in the database, Supabase, Upstash, and Resend values in `.env.local`. Do not paste secrets into chat or commit `.env.local`.
3. Run `npm run auth:check` to validate configuration and test PostgreSQL, Upstash, and Supabase Auth reachability.
4. To create local seed accounts, set `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SEED_ADMIN_EMAIL`, `AUTH_SEED_MEDICAL_SHOP_EMAIL`, `AUTH_SEED_SUPPLIER_EMAIL`, and `AUTH_SEED_CONFIRM=LOCAL_TEST_USERS`. Use distinct inboxes you control and a local/test database only. Then run `npm run db:seed-auth` in an interactive terminal and type the displayed database host to confirm the target. The command pushes only the auth enums and `users` table, then provisions three approved users in both the application database and Supabase Auth. It refuses to run in production or Netlify.
5. Start `npm run dev` and open `http://localhost:3000/login`. OTP email delivery additionally requires the Supabase custom SMTP configuration in Step 3 below.

## 2. Verify `connectpharma.in` with Resend

1. In Resend, add `connectpharma.in` as a sending domain and select a sending region. Resend currently offers Tokyo (`ap-northeast-1`) as its APAC region; this is separate from the Netlify function region.
2. Copy the DNS records shown for that domain in Resend into the authoritative DNS provider for `connectpharma.in`. Publish the exact record names and values Resend provides:
   - **DKIM:** publish the Resend-provided DKIM TXT/CNAME record unchanged.
   - **SPF:** publish the sending/bounce-domain records Resend provides. If a SPF TXT record already exists for the same hostname, merge mechanisms into that single record; do not publish multiple SPF records.
   - **DMARC:** add a TXT record named `_dmarc` if one does not already exist. Start with a monitoring policy, for example `v=DMARC1; p=none; rua=mailto:dmarc@connectpharma.in; pct=100`, and ensure the reporting mailbox exists. Review reports before moving to `p=quarantine` or `p=reject`.
3. Wait for DNS propagation and use Resend's domain verification status. Do not guess DKIM keys or region-specific MX/SPF targets; they are unique to the Resend domain configuration.
4. Send test messages and review SPF, DKIM, and DMARC results in the received message headers. Authentication and domain verification improve trust but cannot guarantee delivery to the Primary inbox; recipient reputation, content, and mailbox-provider filtering also matter.

See Resend's [verified-domain guide](https://resend.com/docs/dashboard/domains/introduction), [region guide](https://resend.com/docs/dashboard/domains/regions), and [Supabase SMTP guide](https://resend.com/docs/send-with-supabase-smtp).

## 3. Configure Supabase Auth

1. In Supabase, enable the Email provider and set the **Email OTP length** to `6` and **Email OTP expiration** to `600` seconds (10 minutes).
2. Under **Authentication → Email → SMTP Settings**, enable custom SMTP and enter:
   - Host: `smtp.resend.com`
   - Port: `465` (implicit TLS; `587` with STARTTLS is also supported)
   - Username: `resend`
   - Password: the Resend API key
   - Sender email: `noreply@connectpharma.in`
   - Sender name: `The Connect Pharma`
3. Under **Authentication → Email Templates → Magic Link or OTP**, set a short subject such as `Your Connect Pharma sign-in code` and paste the contents of [supabase-auth-email-template.html](./supabase-auth-email-template.html). Keep `{{ .Token }}` in the template; do not replace it with `{{ .ConfirmationURL }}` for numeric-code sign-in.
4. Set the Supabase Site URL and allowed redirect URLs for the production domain and local development. The current OTP flow verifies the code server-side and then creates the app's signed session cookie.
5. Provision approved Connect Pharma users in **both** Supabase Auth and the application's PostgreSQL `users` table. This flow calls `signInWithOtp` with `shouldCreateUser: false` and only grants an app session when the matching PostgreSQL account has `status = 'approved'`.

Read Supabase's [passwordless email OTP guide](https://supabase.com/docs/guides/auth/auth-email-passwordless) and [custom SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp) before production use.

## 4. Configure Netlify for Singapore

The Netlify Functions region in `netlify.toml` is `sin`, Netlify's region code for Singapore (`ap-southeast-1`). In the Netlify site dashboard, confirm **Cloud compute → Functions Region → Singapore** and redeploy after changing region or environment variables. Region availability depends on the Netlify plan. Resend's closest currently offered APAC send region is Tokyo, not Singapore.

Add the private variables from Step 1 in the Netlify site's environment-variable settings for the deploy contexts you use. Redeploy after changing them.

## 5. Lifecycle email functions

`src/server/email/resend.ts` exports typed OTP, KYC status, trial-expiry (trial days 60/75/85), and medical-shop enquiry email functions. The current KYC, subscription, and enquiry screens are demo-backed; connect these functions only when their corresponding database-backed events are implemented.

## 6. Verify

1. Confirm Resend shows the domain as verified and Supabase SMTP settings are saved.
2. Check that the target approved email exists in Supabase Auth and PostgreSQL.
3. Request an OTP from `/login`; confirm the email contains a six-digit code and no magic-link button.
4. Enter the code before the 10-minute expiry; confirm the user reaches the role-specific protected page.
5. Confirm the `cp_session` cookie is HttpOnly, SameSite=Strict, Secure in production, and refreshed on protected requests with a 30-day rolling expiry.
