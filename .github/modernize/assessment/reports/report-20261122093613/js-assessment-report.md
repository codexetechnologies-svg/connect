# JavaScript / TypeScript Dependency Assessment

- **Assessment date:** 2026-11-22
- **Project:** `connect-pharma`
- **Method:** `npm-check-updates@19.6.3`, grouped comparison against `package.json`; no dependency versions were changed by this assessment.

## Available updates reported

### Patch

- `tailwind-merge`: `^3.7.0` → `^3.7.1`

### Minor

- `@netlify/plugin-nextjs`: `^5.11.0` → `^5.16.8`
- `@types/google.maps`: `^3.66.10` → `^3.67.0`
- `autoprefixer`: `^10.4.20` → `^10.7.0`
- `postcss`: `^8.4.49` → `^8.5.33`
- `react` and `react-dom`: `^19.2.3` → `^19.3.1`

### Major — requires compatibility planning and validation

- `@next/env` and `eslint-config-next`: `^15.5.29` → `^16.4.6`
- `next`: `^15.5.29` → `^16.4.6`
- `@types/node`: `^22.10.2` → `^26.6.6`
- `eslint`: `^9.17.0` → `^10.15.0`
- `lucide-react`: `^0.469.0` → `^1.77.0`
- `tailwindcss`: `^3.4.16` → `^4.3.5`
- `typescript`: `^5.7.2` → `^7.0.2`

This update inventory is not a security verdict. `npm audit --omit=dev` reported zero production vulnerabilities. The full audit reported four moderate findings through the development dependency chain `drizzle-kit` → `@esbuild-kit` → nested `esbuild`; review its dependency path and upgrade strategy separately. Avoid applying `npm audit fix --force` without resolving the proposed breaking changes.
