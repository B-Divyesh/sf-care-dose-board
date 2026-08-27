# Dose Witness — QA repair handoff

Completed 2026-08-27 for `care-dose-board-repair-1`, repairing report
`74b817dea29a6a71436d5475601eb166195cedc3`.

## Completed repair

- Skip-link activation explicitly focuses `#main-content` and scrolls it into view.
- The built worker cache and manifest start URL use a SHA-256 release identity;
  the worker updates immediately, claims clients, deletes older Dose Witness
  caches only, precaches its shell, and preserves network-first navigation plus
  offline fallback.
- Standard Static Web Apps policy sets immutable caching only for hashed assets,
  revalidates HTML/manifest, no-stores `sw.js`, and emits CSP,
  Permissions-Policy, referrer and nosniff protections.
- Inline executable/style paths were removed so CSP remains strict. IndexedDB
  care records and AES-256-GCM encrypted export/import were preserved.

## Verification

```sh
npm ci
npm test
npm run build
npm run verify:release
npx playwright install chromium
npm run test:e2e
```

- Unit/policy tests: **8/8** passed.
- Build and release-digest verification passed; JS 36.66 kB (11.92 kB gzip),
  CSS 14.18 kB (3.96 kB gzip).
- Mobile Chromium: **4/4** passed, covering exact keyboard focus, encrypted
  record persistence/offline reload, prior-worker update/cache cleanup/toast,
  and legal-page axe scans.
- Local and live `verify-url.sh`: no console errors and title/lang/main/one
  h1/alt/button-label checks passed.

## Deployment and live checks

Deployed as Azure Static Web Apps **Standard** at
<https://care-dose-board.sociobot.in/> (`cc5a4a72-d81a-4281-8c62-52144bfc5003`).
The live release `ba116c2f1e543442` has immutable hashed assets, revalidated
HTML/manifest, no-store worker checks, CSP, and Permissions-Policy.

Fresh 390×844 live Chromium confirmed skip focus, zero serious/critical axe
findings, service-worker activation and offline reload, with no console errors.
Lighthouse 12.6 mobile: **100 Performance, 100 Accessibility, 100 Best
Practices, 100 SEO**; FCP 1.0 s, LCP 1.2 s, CLS 0, TBT 20 ms.

## Boundaries

Care records remain local IndexedDB data; device sharing is encrypted-file
handoff rather than cloud sync. Dose Witness is a coordination record, not
medical advice or proof of administration.
