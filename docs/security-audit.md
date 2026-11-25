# Connect Pharma Security Audit

**Review date:** 2026-11-24 | **Remediation update:** 2026-11-24

**Scope:** Active Express application started by `npm run dev`, its `web/` frontend, authentication and authorization, database access, KYC, billing/webhooks, response headers, deployment configuration, and relevant tests/docs.

> This is a read-only source/configuration review, not a penetration test or security certification. The user confirmed on 2026-11-24 that the application is still under development and is not live. Production verification is therefore pending deployment. No confirmed exploitable vulnerabilities were identified in the reviewed source. The findings table records the initial review; remediation status is summarized below.

## Findings summary

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟡 MEDIUM | `server/index.mjs` | 394-410 | Session cookie `Secure` was conditional on `NODE_ENV`; if production served the app over HTTP or the runtime omitted `NODE_ENV=production`, the cookie could lack the `Secure` attribute. | 8/10 |
| 2 | ⚪ LOW | `server/index.mjs` | 78-84 | Express middleware did not set CSP or HSTS. A production proxy may have added them, but that was not verified. | 9/10 |
| 3 | ⚪ LOW | `netlify.toml` | — | Deployment target was ambiguous: this configuration builds the separate Next.js app, while `npm run dev` starts Express. Production security controls for the active app cannot be confirmed from this configuration alone. | 9/10 |

These are conditional risks and assurance gaps, not confirmed production vulnerabilities. Severity reflects the potential impact if the stated condition exists; confidence reflects confidence in the source/configuration observation, not the presence of the condition in production.

## Remediation status

1. **Session cookies — source fix applied.** Auth cookies now include `Secure` by default and omit it only when `NODE_ENV=development`. Production cookie behavior still needs verification on the actual HTTPS deployment.
2. **Response headers — source fix applied.** Express now sends a CSP on its responses and adds HSTS when `NODE_ENV=production`. The CSP allows inline scripts and styles because the existing static pages use them; that weakens CSP's protection against injected inline code. Removing inline scripts/styles would require a separate, broader refactor and was not included.
3. **Deployment documentation — clarified.** The README now identifies `npm run dev` as the active Express app and states that the Vercel/Netlify sections and `netlify.toml` target the separate Next.js prototype. The user confirmed that there is no live production deployment yet; the future host must be verified after deployment.

The production-mode Express response was checked locally: `/search.html` returned HTTP 200 with `Strict-Transport-Security: max-age=31536000` and the configured Content-Security-Policy. This does not verify production TLS, proxy behavior, browser cookie attributes, or third-party page compatibility.

The public home page rendered in a browser under the new CSP. A production-mode API request returned HTTP 503 because Upstash rate-limit configuration was unavailable in the temporary local instance; this is the existing fail-closed behavior, not a CSP error.

## Latest verification evidence — 2026-11-24

### Production target and TLS

- The repository identifies `npm run dev` as the Express app. The only deployment manifest found is `netlify.toml`, which builds and publishes `.next` for the separate Next.js prototype. No Vercel manifest, Docker/host manifest, or `.github/workflows` deployment workflow was found; GitHub Actions reports zero workflows for this repository.
- The user confirmed that the application is still under development and is not live. There is no production deployment to verify at this time.
- The user-supplied `https://Connectpharma.in` did not resolve from this environment (`DNS name does not exist`; HTTPS request failed before connection with HTTP status `000`). This is consistent with the user's confirmation that the site is not live; it does not establish what hostname will be used after launch.
- No production hostname, hosting-site identifier, certificate, or production reverse-proxy configuration is present in the inspected repository evidence.
- No TLS handshake or certificate validation, production HTTP response, cookie response, header, health endpoint, or provider integration could be observed. No production settings were accessed or changed. Production verification remains pending deployment.

### Local runtime checks (not production)

- `http://localhost:4000/api/health` returned HTTP 200 / `ready`; PostgreSQL was connected and the admin workflow schema was ready. Cashfree billing, private R2 storage, and Supabase identity cleanup reported `not_configured`.
- `http://localhost:4000/api/config` returned HTTP 200 and reported that the Google Maps key is not configured. Only the presence flag was recorded; no key value was retained.
- After restarting the stale local Express process, `http://localhost:4000/search.html` returned HTTP 200 with CSP. HSTS was absent on this local non-production instance, consistent with the production-only HSTS branch.
- An unauthenticated `GET /api/auth/session` returned HTTP 401. Its cookie-clearing response contained `Secure`, `HttpOnly`, and `SameSite=Lax`. This verifies the local clear-cookie response and source configuration, not issuance or browser storage of an authenticated session cookie.
- A temporary local instance started with `NODE_ENV=production` returned HTTP 200 with CSP and `Strict-Transport-Security: max-age=31536000` over HTTP. This verifies response-header generation only; it does not verify TLS or a production proxy.

### Maps and Cashfree under CSP

- The configured CSP permits the existing Maps script/API origins and Cashfree SDK/checkout origins.
- The Maps integration could not be exercised because the local Maps key is not configured. Cashfree checkout could not be exercised because `/api/health` reports Cashfree as `not_configured`. No claim of live provider compatibility is made.
- The current CSP still permits inline scripts and styles to preserve existing static pages; it is not a strict nonce-based policy.
- Maps/Cashfree compatibility against a deployed response policy remains unverified because the application is not live and the local Maps/Cashfree configurations are absent.

### Tests run for this update

- `npm run test:unit`: **9 passed**.
- `node --check server/index.mjs` and `npx eslint server/index.mjs`: **passed**.
- The targeted Playwright navigation regression could not start: the configured web server exited early. `playwright.config.ts` supplies `DATABASE_URL` from `PLAYWRIGHT_TEST_DATABASE_URL`, which is not configured here. The test database was not replaced with the working application database.

## Findings and recommendations

### 1. Session cookie transport protection depends on runtime configuration

**Initial review evidence:** `server/index.mjs:394-407` now defaults auth cookies to `Secure` and omits the attribute only for explicit development mode. The cookies remain `HttpOnly` and `SameSite=Lax`.

**Potential impact:** If a production instance is exposed over plain HTTP or starts without the expected production environment setting, browsers may send the session cookie over an unencrypted connection.

**Remaining action:** Ensure production traffic is HTTPS-only, set `NODE_ENV=production`, and confirm the resulting session cookies include `Secure` on the deployed host.

### 2. CSP and HSTS are not set by the Express response middleware

**Initial review evidence:** `server/index.mjs:78-84` now sets CSP on Express responses, and HSTS for production mode. The CSP allows `'unsafe-inline'` for scripts/styles to preserve existing pages; it is not a strict nonce-based policy.

**Potential impact:** The active app may lack defense-in-depth against content injection and HTTPS downgrade risks if those headers are also absent at the production edge. No injection vulnerability was confirmed by this review.

**Remaining action:** Verify both headers at the production Express origin and edge/proxy. Review browser console behavior for Maps and Cashfree on configured deployments before tightening allowed sources or removing inline allowances.

### 3. Production deployment target is not established by repository configuration

**Evidence:** `npm run dev` runs `node server/index.mjs` (`package.json`), while `netlify.toml` builds and publishes the Next.js app. The README now explicitly identifies these as separate application paths. The user confirmed there is no live production deployment yet.

**Potential impact:** Security controls reviewed in Express cannot be compared with a deployed application until the intended production application and host are selected.

**Remaining action:** After deployment, confirm which application and host receive production traffic, then verify TLS, headers, secrets configuration, provider settings, and health checks before treating this audit as production assurance.

## Verified controls

- **Authentication and authorization:** Protected API paths validate Supabase identity, approved account status, and role before allowing access (`server/index.mjs:508-548, 960-961`).
- **Database access:** Reviewed queries use parameterized `postgres` tagged templates; sensitive mutations include ownership, role, or account-status conditions.
- **Session and request controls:** Auth cookies are `HttpOnly` and `SameSite=Lax`; state-changing routes use an Origin check. Login/signup inputs are bounded, and production rate limiting fails closed when Upstash is unavailable.
- **Response headers:** The Express app now sets CSP on responses and sets HSTS when `NODE_ENV=production`; the live deployment has not been checked.
- **Payment webhook:** Cashfree signatures are checked against the raw request body using HMAC and timing-safe comparison.
- **KYC handling:** Uploads are size/type limited and account-scoped; admin downloads use short-lived signed URLs when private storage is configured. Malware scanning is not implemented and is documented as absent.
- **Frontend output:** Reviewed API-backed dynamic HTML uses escaping for displayed values.

These controls were verified in source, not exercised against production services.

## Audit limitations

- No live production deployment exists yet, as confirmed by the user; TLS configuration, edge/proxy headers, and production runtime environment could not be inspected.
- Environment secrets were not accessed or printed.
- No live database, Supabase, Cashfree, or object-storage operations were performed.
- Provider configuration, bucket privacy, session-cookie attributes in a deployed browser, and production deployment target remain unverified.
- No penetration test or dependency scan was run as part of this source review. After the source changes, `node --check server/index.mjs`, ESLint for the Express server, and all 9 server unit tests passed.

## Suggested follow-up

1. After launch, confirm the production deployment target and verify HTTPS, response headers, and session-cookie attributes on that target.
2. Validate CSP compatibility with configured Maps and Cashfree flows, then consider removing inline allowances only if the existing pages are migrated accordingly.
