# Dose Witness — QA repair handoff

Completed 2026-08-27 for `care-dose-board-repair-1`, repairing report
`74b817dea29a6a71436d5475601eb166195cedc3` against candidate
`19cdafc7ff4c95ccbbccb93c8438e8122848a038`.

## Completed repair

- Skip-link activation explicitly focuses `#main-content`, retains its fragment,
  and scrolls it into view. The landmark remains programmatically focusable.
- Vite stamps a SHA-256-derived 16-character release identity into the worker
  cache namespace and the manifest start URL. The worker updates immediately,
  claims clients, precaches the shell, removes only older Dose Witness caches,
  keeps navigation network-first, and retains the offline fallback.
- `staticwebapp.config.json` configures Standard Static Web Apps with immutable
  one-year caching for hashed `/assets/*`, revalidation for app HTML/manifest,
  and no-store worker checks. It also supplies CSP, Permissions-Policy, HSTS-
  compatible referrer protection, nosniff, SPA fallback, and webmanifest MIME.
- Removed inline executable/style paths from the app and offline page so CSP
  remains strict (`script-src 'self'; style-src 'self'`), while preserving the
  offline page and care-record UI.
- IndexedDB local records and AES-256-GCM encrypted export/import are unchanged.
  Unit coverage still verifies encrypted round trip and wrong/short passphrase
  recovery.

## Regression coverage and verification

```sh
npm ci
npm test
npm run build
npm run verify:release
npx playwright install chromium
npm run test:e2e
```

- `npm test`: **8/8** unit/policy tests passed.
- `npm run build` and `npm run verify:release` passed. Initial JS is 36.66 kB
  (11.92 kB gzip) and CSS 14.18 kB (3.96 kB gzip), within budget.
- `npm run test:e2e`: **4/4** mobile Chromium tests passed: exact keyboard
  focus, encrypted/persisted care record plus offline reload, simulated old
  worker upgrade/stale-cache deletion/update toast, and legal-page axe scans.
- Local `verify-url.sh` passed with no console errors and title/lang/main/one
  h1/alt/button-label checks.

## Deployment and live evidence

Deployed as an Azure Static Web Apps **Standard** static site to
<https://care-dose-board.sociobot.in/> using deployment
`1e4056ab-6d5a-48e1-bc09-8353fa31761c`.

- Live worker and manifest both expose release `3ed32c653487e7e8`.
- Live hashed JS/CSS return `public, max-age=31536000, immutable`; root/legal
  HTML revalidates; `sw.js` returns `no-cache, no-store, must-revalidate`.
  CSP and Permissions-Policy are present on all checked responses.
- Live `verify-url.sh`: HTTPS 200 in 777 ms, no console errors, and all
  baseline semantic checks passed.
- Fresh 390×844 live Chromium: skip focus landed on `main-content`, axe found
  **0 serious/critical** issues, worker activation and offline reload succeeded,
  and no console errors occurred.
- Lighthouse 12.6 mobile: **100 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO**; FCP 1.0 s, LCP 1.2 s, CLS 0, TBT 20 ms.

## Product boundaries

Care records stay in local IndexedDB. Device sharing is explicit encrypted-file
handoff; there is no cloud sync. Dose Witness is a household coordination
record, not medical advice, prescription validation, or proof of administration.
