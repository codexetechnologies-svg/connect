# Connect Pharma Production-Readiness Audit

**Assessment date:** 2026-11-22  
**Scope:** Repository implementation, route and action flows, current local environment readiness, automated test results, and dependency checks.

## Executive decision

**No-go for production marketplace launch.** The app has a broad prototype UI, but its core marketplace operations are not connected end-to-end to persistent business data. Authentication has two competing implementations, role-specific authorization is not enforced, KYC submission explicitly returns `503`, billing is not connected, and the readiness endpoint currently returns `503`.

These are source-based estimates, not telemetry measurements; authentication and role estimates were revised after the changes below:

- **Prototype UI coverage:** approximately **75%** of the visible screens and demo interactions are present.
- **Production end-to-end feature readiness:** approximately **18%** across the core marketplace workflows. This score reflects persistence, external integrations, access control, and verified end-to-end behavior—not the amount of UI code.

## Feature inventory and status

| Feature / route | Estimate | What works now | Production gap |
|---|---:|---|---|
| Public landing `/` | 80% | Landing content, English/Tamil toggle, navigation, marketplace calls to action | Claims and product data are not backed by live supplier/catalogue data; calls to protected portals require sign-in |
| Login `/login` | 55% | Clerk sign-in screen supports email and Google; unauthenticated route and login UI are covered by browser tests | Production login still depends on Clerk configuration and an approved matching application account; legacy Supabase OTP code remains disconnected |
| Sign-up `/sign-up` | 5% | Page clearly explains that registration is unavailable | No role selection, application-user provisioning, or KYC onboarding; this is intentionally closed until onboarding is implemented |
| Session and role access | 55% | Clerk protects routes; server-side account lookup requires a verified email matched to an approved database user; role-specific layouts reject wrong-role access and protected navigation is role-filtered | Requires a configured database and approved account provisioning; verify every API/server operation independently, and remove or formally retire legacy `cp_session`/Supabase OTP code |
| Dashboard `/dashboard` | 10% | Static metrics and a refresh notice | Refresh does not refresh data; displayed counts, approvals, subscription and account state are hard-coded |
| Shop search `/search` | 25% | In-memory sample suppliers; text, brand, pack, and distance filters; comparison button scrolls to results | No database-backed catalogue, freshness/expiry/recall validation, order or quote-request action, or real supplier availability |
| Supplier map `/map` | 30% | Google Maps integration code, loading/error states, and external Maps links | Uses example city coordinates; current environment has no Maps key; location accuracy, coverage, and real supplier data are unverified |
| Supplier catalogue `/supplier/catalogue` | 25% | Sample table and client-side CSV parsing/validation | Imported rows only live in browser memory and disappear on navigation/reload; no server persistence, ingestion job, duplicate handling, or stock/expiry controls |
| Supplier enquiries `/supplier/enquiries` | 20% | Sample leads, response form changes a local status, CSV export | Response is not persisted or sent to the shop; no real enquiry creation, ownership check, notification, or status history |
| Admin KYC queue `/admin/approvals` | 10% | Sample queue, review panel, and local approve/request-documents actions | Sample-only state; no document review or audit history. `POST /api/kyc/submit` intentionally returns `503` |
| Plans `/admin/subscriptions` | 10% | Four sample plans; selection is saved in browser local storage | No server-side subscription, payment, renewal, entitlement/SKU-limit enforcement, invoice, or cancellation flow |
| Revenue `/admin/revenue` | 10% | Static chart and summary values | No ledger, tax calculation, reconciliation, invoice generation, or live reporting |
| Email notifications | 20% | Supabase OTP action and typed Resend email helpers exist in code | OTP UI is disconnected; KYC, enquiry, and trial emails have no workflow call sites; current environment lacks delivery configuration |
| English/Tamil localization | 70% | Shared language provider and translated user-facing copy | Translation completeness and consistency across every route/state have not been independently validated |
| Privacy and terms | 15% | Public pages and footer links exist | Current copy is brief and generic; privacy, retention, regulated-marketplace terms, and legal review are not evidenced |
| Operations/readiness | 20% | Health endpoint checks database and external-service configuration | Current `/api/health` result is `503 not_ready`; deployment monitoring, backup/restore, alerting, and production smoke checks are not evidenced |

Percentages estimate usable production flow completion. They should not be read as a formal compliance or security certification.

## Current user flows and wireframe review

No wireframe, Figma export, flowchart, or user-journey diagram was found in the repository. Therefore the implemented UI can be traced, but it cannot be certified as matching an approved wireframe or product specification.

### Public visitor

`Landing → Search / Supplier Catalogue / Admin link → protected-route sign-in`

Protected navigation is filtered by the resolved account role, and role-specific layouts reject access to another portal. The public navigation can still direct visitors to protected destinations, where authentication and approval are required.

### Sign-in and onboarding

`Login → Clerk sign-in → verified email matched to an approved application account → role-specific portal`

The active login uses Clerk. Legacy Supabase OTP code remains in the repository but is not connected to the login page. New registration is deliberately closed until application-account provisioning and KYC onboarding are available:

`Registration unavailable → no unprovisioned Clerk-only account is created`

### Medical shop

`Sign-in → Search → filter offers → Compare suppliers`

The filter and compare interactions work on bundled sample data. The compare action scrolls to the results; it does not create an enquiry or contact a supplier. Map is a separate route and uses example coordinates.

### Supplier

`Sign-in → Catalogue → choose CSV → parse/validate → show imported rows`

This flow ends in client memory. The enquiry screen's `Respond → enter quote → Save response` changes only local status and explicitly does not send the quote to the shop. Export downloads sample leads.

### Administrator

`Sign-in → review sample account → approve/request documents`

The queue and counts are local sample state. There is no real KYC document submission/review flow. Plan selection is local storage, and revenue is static.

## Release-blocking findings

### P0 — Do not launch marketplace transactions

1. **Core business data is demo-backed.** Search, catalogue, enquiries, approvals, dashboard, subscriptions, and revenue use `src/lib/data/mock-data.ts` or component-local state. There is no end-to-end persistent business workflow.
2. **Identity and account provisioning are incomplete.** Clerk is now the active provider and the visible sign-in page, README, and auth configuration checks are aligned. Legacy Supabase OTP code and `cp_session` support remain disconnected; Clerk users still need an approved application-account record and a production onboarding/provisioning workflow.
3. **Authorization coverage and configuration still need release verification.** Approved-account lookup and role guards now protect the portal layouts, and protected navigation is role-filtered. The database is not configured in this workspace, and every API/server operation must be verified to enforce equivalent authorization before release.
4. **No usable onboarding/KYC path.** KYC submission returns `503`; no private document storage is connected. Public sign-up is intentionally closed until role selection, account provisioning, and KYC review are implemented.
5. **No billing or entitlements.** Plan selection is a browser-only demo. `netlify.toml`/README readiness refer to Cashfree environment variables, while the SQL schema names Razorpay payment fields. The payment provider and implementation are not reconciled.
6. **No real medicine marketplace controls.** Live inventory, batch expiry/recall checks, supplier verification, stock freshness, quantity/order validation, quote delivery, and audit history are not connected.
7. **Current deployment readiness is false.** The last `/api/health` check returned `503`; this workspace has no database URL, so approved-account lookup and persistent workflows cannot run. Clerk configuration passes `npm run auth:check`; database and other production service configuration remain incomplete.

### P1 — Required before a production release

8. **Database model drift and incomplete ORM coverage.** `database/schema.sql` describes business tables that are not represented in the current Drizzle schema. There are also field-name/model differences, including `unit_of_measurement` versus `unit_of_measure`, `schemes_and_discounts` versus `schemes`, and `prescription_requirement` versus `dispensing_type`. Define and apply versioned migrations, then verify every deployed schema against the ORM.
9. **Protected-flow E2E tests are not passing.** Playwright ran 14 tests: 8 passed and 6 failed. The five authenticated search/catalogue/enquiry/approval/plan flows and the map flow landed on Clerk's sign-in screen rather than the expected page. The current tests inject a custom `cp_session`, while normal route protection uses Clerk; resolve the test/auth contract and rerun before release.
10. **Lint command is not CI-ready.** `npm run lint` invokes deprecated `next lint` and opens an interactive configuration prompt, exiting with code 1. Configure a non-interactive ESLint CLI command and enforce it in CI.
11. **Legal and privacy copy is not production-ready.** Obtain review for regulated pharmaceutical marketplace responsibilities, KYC data purposes/retention/access/deletion, supplier/customer terms, pricing/availability disclaimers, dispute handling, and contact/support details.
12. **Deployment controls need validation.** Verify production CSP compatibility with the chosen identity provider and Google Maps, role-protected admin/API access, secret handling, data backups/restoration, logging/alerts, and deployment-context environment variables.
13. **Accessibility and failure-state coverage is incomplete.** Test keyboard/screen-reader behavior, mobile layouts, empty/error/loading states, and production-like browser flows, including actual Clerk callbacks and Maps failures.

## Verification performed

| Check | Result |
|---|---|
| `npm run build` | Not rerun after the auth/role changes; the existing dev server is using the shared `.next` directory, so a concurrent build was avoided |
| `npm run typecheck` | Passed after current changes |
| `npm run test:limits` | Passed: 4/4 |
| `npm run test:e2e -- --workers=1` | Passed: 16/16; a default-parallel run had one transient navigation timeout that passed when isolated and in the serial run |
| `npm run lint` | Passed |
| `npm audit --omit=dev --audit-level=moderate` | Passed: 0 production dependency vulnerabilities reported |
| `npm audit --audit-level=moderate` | Failed: 4 moderate findings in the development dependency tree, through `drizzle-kit` / `@esbuild-kit` / nested `esbuild` |
| `npm run auth:check` | Clerk configuration passed; database and remaining production service configuration are not complete |
| `GET /api/health` | `503 not_ready`; all six readiness checks were false or unconfigured |

The full dependency audit's findings are in the development toolchain; do not apply `npm audit fix --force` blindly, because npm proposes a breaking `drizzle-kit` change. Review and update the affected toolchain deliberately.

The dependency update check reports patch/minor updates and major upgrades including Next.js 16 and Tailwind CSS 4. These are upgrade candidates, not a recommendation to bundle framework migrations into production-readiness fixes.

## Recommended release gates

1. Retire the unused Supabase OTP and legacy `cp_session` paths, provision approved application accounts for Clerk identities, and verify role/approval authorization on every protected page and server/API operation.
2. Complete user registration and KYC submission/review with private storage, verification/audit events, and clear rejection/resubmission states before reopening sign-up.
3. Reconcile the database schema, create reviewed migrations, and implement persistent catalogue, search, enquiry, quote, subscription, and reporting workflows.
4. Select and implement one payment provider, including signed webhook verification, idempotency, billing lifecycle, invoices, and entitlement enforcement.
5. Configure production services and verify `/api/health` returns ready without exposing sensitive configuration.
6. Require all critical E2E flows, typecheck, lint, dependency review, and a production build to pass in CI. Investigate the parallel navigation timeout under CI load.
7. Complete product wireframes/flow acceptance review and legal, accessibility, backup/restore, monitoring, and incident-response checks.

**Final status: NOT READY TO DEPLOY as a live pharmaceutical marketplace.** A static/demo preview deployment is a separate decision and must be clearly labeled as non-transactional.
