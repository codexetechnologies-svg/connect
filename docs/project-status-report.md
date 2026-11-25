# Connect Pharma — Project Status Report

**Updated:** 2026-11-24  
**Scope:** Active Express app (`npm run dev`, serves `web/`), its APIs, configured database health, targeted tests, and documented integrations.

> Percentages below are reasoned completion estimates, not measured code coverage, uptime, or a security certification. “Implemented” means code/UI exists; it does not mean a live third-party flow was exercised.

## Executive status

| Area | Estimated status | Current assessment |
|---|---:|---|
| Frontend and UI | **82%** | Main public, retailer, supplier, and admin screens exist. Responsive styling, role-aware navigation, sign-in/sign-up, icons, and transitions are implemented. Some pages remain placeholders or have unfinished workflows. |
| Authentication and roles | **78%** | Supabase sign-in, account-first sign-up, role routing, and automatic retailer/distributor activation after email verification are implemented. Browser tests mock auth endpoints; a live email-confirmation cycle was not verified in this assessment. |
| Backend workflows | **72%** | APIs cover search/map data, supplier catalogue reads/deletes, enquiry responses, admin account review, plans, billing, and KYC. Some end-to-end business actions are still missing or provider-blocked. |
| Database runtime | **88%** | Live health reports PostgreSQL connected and admin workflow schema ready. This does not verify every feature’s data quality or production backup/restore. |
| Security controls | **68%** | Role checks, same-origin checks, request limits, validation, reasoned audit events, private-storage code, safe deletion orchestration, secure-by-default auth cookies, and Express CSP/HSTS headers exist. External storage/identity cleanup are unconfigured; production deployment controls remain unverified. |
| Automated verification | **75%** | Targeted unit, browser, lint, and type checks pass. Most browser tests mock API/provider responses; the full live integration surface was not exercised. |
| External integrations | **35%** | Database is live. Cashfree, private R2 storage, and server-side Supabase identity cleanup are not configured according to the health endpoint. |
| **Overall implementation** | **~68%** | A substantial working prototype with several database-backed admin flows. |
| **Production readiness** | **~45%** | **Not ready for a live transactional launch** until integrations, operational controls, and end-to-end release gates are completed. |

## Live system check

`GET /api/health` was checked at the local app (`localhost:4000`) on **2026-11-24**. Production health was not checked:

| Check | Result |
|---|---|
| Endpoint status | `ready` (HTTP 200) |
| Database | `connected` |
| Admin workflow schema | `ready`; no missing workflow objects reported |
| Cashfree billing | `not_configured` |
| Private KYC storage | `not_configured` |
| Supabase identity cleanup | `not_configured` |

**Important:** this endpoint’s `ready` status confirms database connectivity and the checked admin schema. It does **not** mean all providers are configured or the entire product is production-ready.

## User flows and feature status

| Flow / feature | Estimate | Status |
|---|---:|---|
| Public home, navigation, sign-in/sign-up UI | **90%** | Screens and responsive navigation are implemented; sign-in/signup role behavior is covered by browser tests. |
| Sign-in → role-specific portal | **80%** | Admin, supplier, and medical-shop routing and protected navigation are implemented. Live Supabase credentials/session behavior was not exercised by the browser tests. |
| Sign-up → email verification → role portal | **75%** | Roles map to `supplier` and `medical_shop`; verified retailer/distributor accounts are auto-approved. Verify the Supabase redirect allowlist and complete a real email test before launch. |
| Admin approvals and account status | **85%** | Approval, rejection/suspension/reinstatement paths require a reason and record audit events. |
| Admin plans and audit history | **80%** | Database-backed plan management and audit APIs/UI exist. |
| Search and supplier map | **65%** | Search/map APIs query approved supplier data. Map coordinates are city-level estimates; real supplier locations and a configured map key are not verified here. |
| Supplier catalogue | **55%** | Supplier-scoped listing reads and deletes are implemented. Persistent catalogue creation/import is not established end-to-end; the CSV import remains a known gap. |
| Supplier enquiries | **60%** | Suppliers can read enquiries and persist responses/status changes. Medical shops can now submit an enquiry for a search result; the browser interaction passed with mocked APIs, but database persistence and the buyer-to-supplier round trip have not been verified live. |
| Billing and settled revenue | **45%** | Cashfree order/webhook code and settled-gross reporting exist. Cashfree is unconfigured and checkout/webhooks have not been live-tested. Renewals are manual; GST invoicing/calculations are not implemented. |
| KYC upload and review | **45%** | Upload, review-reason, and short-lived private download flows are implemented in code. R2 is unconfigured, so real document storage/review is blocked. Malware scanning is not implemented. |
| Account deletion | **55%** | Retryable deletion workflow is implemented to suspend first, clean linked Auth/R2 data, and retain payment history. It cannot run until server-only Supabase service credentials and any required storage are configured and tested. |

## Security and operations

**Implemented controls**

- Server-side account and role checks protect privileged API groups.
- Mutating requests use same-origin checks; sign-in, sign-up, and public-data endpoints are rate-limited.
- Session cookies are HTTP-only and same-site; account status changes invalidate sessions.
- Auth cookies now default to `Secure` except in explicit development mode. Express sends a Content-Security-Policy and adds HSTS when `NODE_ENV=production`; the CSP retains inline allowances required by existing pages.
- Signup restricts public roles, validates fields and consent, and returns generic duplicate-registration responses.
- Admin approvals, status changes, KYC reviews, and deletions require a reason recorded for audit.
- KYC code checks allowed MIME types, size, and file signatures, and uses short-lived download URLs when private storage is configured.
- The Cashfree webhook verifies signatures against the raw request body.

**Remaining security/release gaps**

- Cashfree, R2, and Supabase service-role cleanup are not configured; their security properties are therefore not live-verified.
- The production host/TLS/proxy configuration has not been verified. Production HSTS/cookie behavior is documented and locally checked, not validated on the deployed host.
- The CSP permits inline scripts/styles for current pages, so it is not a strict nonce-based policy.
- Malware scanning, production backup/restore testing, monitoring/alerting, and a formal incident process are not evidenced.
- Legal/privacy review is still needed for pharmaceutical marketplace responsibilities, KYC retention, and deletion policy.
- A source/configuration review found no confirmed exploitable vulnerability; it was not a penetration test or independent third-party audit.
- The last recorded production-dependency audit reported **0 production dependency vulnerabilities**; it was not rerun for this report. Re-run dependency/security checks before release.

## Verification run

Latest targeted checks recorded in this workspace:

- `npm run test:unit`: **9 passed**.
- Login/signup Playwright suite: **11 passed** (API behavior is mocked in browser tests).
- Navigation/icon/admin-approval suite: **17 passed, 1 skipped**. The skipped test requires an isolated PostgreSQL test database.
- Medical-shop enquiry submission UI: **passed** with mocked session, search, and create-enquiry APIs; the database write was not exercised.
- `npm run typecheck`: **passed**.
- Targeted ESLint and JavaScript syntax checks: **passed**.
- Live health endpoint: database connected; admin workflow schema ready; provider gaps listed above.
- Security audit: source/configuration review documented in [security-audit.md](./security-audit.md); production behavior remains unverified.

These are focused checks, not a complete live acceptance test. In particular, real Supabase email, Cashfree checkout/webhook, R2 document upload/download, and account deletion were not exercised end-to-end.

## Priority before production

1. Configure and verify Supabase email delivery and redirects; run a real signup, confirmation, automatic activation, and sign-in cycle.
2. Configure Cashfree sandbox and exercise checkout, signed webhook, idempotency, and revenue reconciliation.
3. Configure a private R2 bucket and verify upload, review, short-lived download, and cleanup.
4. Configure the server-only Supabase service-role key and safely test account deletion/retry behavior.
5. Complete persistent catalogue import/create; verify enquiry persistence and the full retailer enquiry-to-supplier-response flow against an isolated database.
6. Validate the existing KYC checks and retention behavior; complete privacy/legal review and test backup/restore and monitoring for the current workflows.
7. Run the full browser suite against an isolated test database and perform a production-like release review.

## Documentation note

The [production-readiness audit](./production-readiness-audit.md) describes an older architecture and is explicitly historical. The README also still calls approval and plan actions demo-only, although database-backed APIs now exist; catalogue import and parts of the enquiry flow remain incomplete. Treat this report and current local runtime check as the latest snapshot, and reconcile those documents before using them as release guidance.
