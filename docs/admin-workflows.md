# Admin, billing, and KYC workflows

The HTML app's admin APIs require an approved admin session. Apply
`database/migrations/0003_admin_billing_kyc.sql` to the intended PostgreSQL
database after taking a backup and before using the account, plan, payment, or
KYC workflows. Migrations are not applied automatically. The migration stops
with an error if existing KYC status values are not recognized; review and
resolve those values before retrying. `/api/health` reports the missing schema
objects without exposing credential values.

## Cashfree billing

Set `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENV=sandbox`, and
`PUBLIC_APP_URL` in the local environment. Cashfree signs webhooks with the PG
secret key; leave `CASHFREE_WEBHOOK_SECRET` blank to reuse it, or set it to the
same key. Use the
Cashfree production environment only after the merchant account and webhook are
verified. Configure the `PAYMENT_SUCCESS_WEBHOOK` event to call
`/api/webhooks/cashfree`. The webhook signature is checked against the exact raw
request body, and duplicate payment events do not create duplicate subscriptions.
The app's health check reports configuration presence, not successful provider
connectivity; verify sandbox checkout and webhook delivery before production.

Checkout currently bills suppliers and medical shops for one 30-day period.
Renewals are manual, not recurring. Subscriptions are activated only after a
signed Cashfree success event. Revenue reports show settled gross INR only; GST
invoices and tax calculations are not implemented.

## Private KYC documents

Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET`.
Keep the bucket private; uploads stream through the app server and admin reads
use short-lived signed downloads, so public object access and browser bucket CORS
are not needed. Documents are limited to PDF, JPEG, or PNG files up to 10 MB.
Supported types are wholesale/retail drug licences and GST certificates; do not
upload personal identity documents.

KYC review notes and account/plan changes are recorded in the admin audit log.
Documents are retained until account deletion. The admin account page provides
a reasoned, confirmed deletion action. It suspends the account and invalidates
its app sessions, snapshots its KYC object keys, removes those private R2
objects, removes its linked Supabase Auth identity, then deletes the application
account. Failed provider or database cleanup leaves the account suspended and
the deletion job retryable; submit the same deletion action again after fixing
the reported service. Do not delete accounts directly in SQL.

Set `SUPABASE_SERVICE_ROLE_KEY` only in the server environment to enable
Supabase Auth identity deletion. It is a privileged secret and must never be
included in browser code or returned by health endpoints. Accounts with
unrecognized or unresolvable Auth identities are not deleted.

Settled payment rows are retained for reporting after account deletion, with
their account foreign key set to null. The deletion audit record and reason are
retained. Confirm these data-retention periods with the organization’s legal
and privacy owners before production use.

## Account and plan management

New retailer and distributor sign-ups are activated automatically after email
verification. The manual account approval action remains for existing pending
accounts. Admin approvals, rejections, suspensions, reinstatements, and deletions
require a reason recorded in the audit log. Admin accounts cannot be changed or
deleted through these workflows. Plans are deactivated rather than deleted so
existing subscriptions keep their plan reference.

## Remaining production controls

Cashfree automatic recurring charges, GST invoices/calculations, and KYC
malware scanning are not implemented. Renewals are manual. Complete a security,
privacy, tax, and operational review; configure and verify the external
providers; and back up the database before applying migrations or performing
real account deletions.
