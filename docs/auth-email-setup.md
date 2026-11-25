# Authentication and account registration

The active Express app uses Supabase Auth for email/password identities and the PostgreSQL `users` table for Connect Pharma account roles and approval status. The account role stored in PostgreSQL is authoritative; public sign-up cannot create admin accounts.

## Required configuration

Set these variables in `.env.local` for development and in the deployment platform for each environment:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL database for account records |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` | Public Supabase Auth API key, used by the server |
| `PUBLIC_APP_URL` | Base origin used to construct the email-confirmation redirect, such as `https://connect.example.com` |
| `UPSTASH_REDIS_REST_URL` | Shared rate limits for authentication requests |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash credential; keep private |

In development, Upstash can be omitted; the app uses an in-memory limiter that is not suitable for production or multiple instances. `SUPABASE_SERVICE_ROLE_KEY` is not needed for registration; it is used only for server-side administrative cleanup such as account deletion. Never expose it to browser code.

## Supabase email configuration

The active Express app sends confirmation and password-reset requests through Supabase Auth REST endpoints. It does not send these messages with Resend; `RESEND_API_KEY` and `EMAIL_FROM` do not affect these flows. Configure a working SMTP provider under **Supabase Dashboard → Authentication → SMTP Settings** and use a sender address/domain verified by that provider. Supabase's default email service is rate-limited and is not intended for reliable production delivery.

The app's `PUBLIC_APP_URL` must be the origin where the Express app is reachable. The app builds explicit redirects from it. In the Supabase project's Auth URL configuration, allow both exact redirects:

```text
${PUBLIC_APP_URL}/login.html?verified=1
${PUBLIC_APP_URL}/login.html?mode=reset-password
```

For local development with `PUBLIC_APP_URL=http://localhost:4000`, allow `http://localhost:4000/login.html?verified=1` and `http://localhost:4000/login.html?mode=reset-password`. Keep the confirmation and recovery email templates enabled and make sure each template uses the supplied `{{ .ConfirmationURL }}` link.

## Database setup

Back up the database, then apply `database/migrations/0003_admin_billing_kyc.sql` if it has not already been applied. Signup requires its `users.supabase_auth_id` column and unique index. This migration is not run automatically during builds.

## Account and email behavior

- The sign-in and sign-up modes share `/login.html`. On sign-up, users choose **Retailer** (`medical_shop`) or **Distributor** (`supplier`).
- The sign-in screen can resend verification email and request a password reset. Reset links return to `/login.html?mode=reset-password`, where the user sets a new password.
- Registration creates a pending row in PostgreSQL `users` and a Supabase Auth identity, then links the identity to that row. The selected role is saved in PostgreSQL, not trusted from Supabase user metadata.
- If an email identity was created directly in Supabase Auth, complete sign-up through the app with that identity's email and password, choose the role, and accept the terms. The app links only a valid, email-confirmed identity. Creating a Supabase Auth user alone does not create an app account or grant a role.
- Retailer and distributor accounts are automatically approved after email verification. The email confirmation callback updates `users.email_verified` and activates a pending account. Manual approval remains available for existing pending accounts; it is not required for new sign-ups.
- Sign-up is account-first. Business licence, address, and other supplier or retailer profile details are not collected or created by this form; those belong to the later profile/KYC workflow.
- Admin registration is not public. Provision an admin account through a controlled operator workflow.
- Duplicate registrations receive a generic response to avoid revealing whether an email is already registered.

Use `/api/health` to inspect service configuration without exposing credential values. Production also requires the other provider integrations documented in [Admin, billing, and KYC workflows](./admin-workflows.md).

## Local read-only role preview

Run `npm run dev:preview` and open `/login.html` on the same computer to preview distributor and retailer portals without email authentication. This mode is enabled only by that development command, only for loopback requests, and all API write requests are rejected. It uses synthetic preview accounts and cannot be enabled when `NODE_ENV=production`.
