# Dose Witness — repair handoff

Completed August 27, 2026 for work order `care-dose-board-repair-1`.

## What changed

- Fixed the keyboard skip link: activation now moves focus to `#main-content`, retains the `#main-content` fragment, and leaves the next Tab at board content rather than header navigation.
- Replaced the fixed service-worker cache name with a 16-character SHA-256 revision calculated from the exact final `dist/` release files. The generated web manifest uses the same revision in its PWA start query.
- The worker precaches the release shell, uses cache-first static assets, navigation network-first with an offline fallback, calls `skipWaiting`/`clients.claim`, and deletes older Dose Witness cache namespaces during activation. Cache matching ignores response `Vary` differences so a cached shell works with static hosting as well as the local preview server.
- Added `staticwebapp.config.json` for Standard Static Web Apps: immutable one-year caching for hashed `/assets/*`, no-cache worker/manifest behavior, strict CSP, Permissions-Policy, nosniff, referrer policy, and SPA fallback.
- Removed inline reload handlers so the CSP can keep `script-src 'self'`; encrypted IndexedDB care data and AES-256-GCM export/import behavior were not changed.

## Regression coverage and local verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Passed locally on August 27, 2026:

- `npm test` — 5/5 unit tests (scheduling, merge, encrypted export/import and error handling).
- `npm run build` — TypeScript check and production `dist/` build passed. Initial JS is 36.83 kB (11.98 kB gzip); CSS is 14.08 kB (3.93 kB gzip).
- `npm run test:e2e` — 5/5 mobile Chromium tests passed: exact skip-focus keyboard path; release-derived worker cache and prior-cache cleanup; static policy contract; encryption/persistence plus `context.setOffline(true)` reload; and legal-page axe scans.
- Axe scans in the browser suite have zero serious/critical findings. The functional mobile flow records an uncertain witnessed dose, persists it, and reloads the same handoff offline without console errors.

## Deployment and live verification

Deployed `dist/` as a Standard Azure Static Web App to
<https://care-dose-board.sociobot.in/> on August 27, 2026 (final deployment
`9f654589-b906-4723-89f4-e30d97b46249`).

- `/opt/fleet/lib/verify-url.sh` passed live: HTTPS 200, 700 ms load in its desktop check, no console errors, title and `lang`, exactly one h1, main landmark, and no missing image alt or unlabeled button.
- Live header checks confirm `Cache-Control: public, max-age=31536000, immutable` for the hashed JS/CSS assets; `no-cache, no-store, must-revalidate` for `sw.js`; and revalidation for the manifest. CSP, Permissions-Policy, nosniff, and referrer policy are all present. The `.webmanifest` MIME is `application/manifest+json`.
- Live Chromium exercised the skip link (focused skip link → focused `#main-content`), waited for the active worker, switched offline, and reloaded successfully. The same run found zero serious/critical axe issues on desktop and Pixel 5 emulation, no console errors, and no mobile horizontal overflow.

## Known product boundaries

- The optional Sociobot household unlock still requires factory product registration; no payment credentials are in the repository.
- Devices exchange records only through explicit encrypted handoff files, not cloud sync.
- This is a household coordination record, not medical advice, prescription validation, or proof of administration.
