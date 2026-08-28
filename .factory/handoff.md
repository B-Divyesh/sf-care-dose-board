# Dose Witness — adversarial review 2 handoff

## Result

**FAIL.** The full report is in `.factory/review-2.md`. This was a review-only
work order; no product source was changed.

The review records 5 blocking, 1 major, and 4 minor findings. The blocking
items are the disappearing phone demo banner, dead Sociobot checkout, missing
production-404 metadata, a mobile artwork target hidden by the sticky header,
and the production 404’s missing standard footer.

## Verification performed

- Opened production cold in fresh 390×844 and 1440×900 Chromium contexts.
- Entered the one-click demo, changed sample data, reset it, exited it, and
  confirmed a completed real-board save remained separate.
- Recorded the live demo request log, confirmed same-origin-only requests,
  confirmed no demo IndexedDB database, and reloaded the demo offline.
- Crawled every link exposed by `/`, `/demo`, `/medications`, `/handoff`,
  `/settings`, `/privacy`, and `/terms`.
- Checked titles, descriptions, canonicals, Open Graph data, favicons, h1/main
  counts, header/footer presence, deep links, Back focus, and the real HTTP 404.
- Ran live axe scans on all app routes and the 404; there were no serious or
  critical violations.
- Compared the clean build’s `dist/index.html` and `dist/404.html` with live;
  both pairs were byte-identical.
- Audited every landing and README sentence with a word count and mapped each
  copy flag to a proposed rewrite.
- Rechecked every B1–B4 and M1–M6 item from `.factory/review-1.md` live and in
  source.

## Clean-clone commands

The clean clone was at `/tmp/tmp.07z790V8yh/repo`, SHA `d6d1da0`.

```sh
npm ci
npm test
npm run build
npm run verify:release
npm run test:e2e
```

Results: 9/9 unit/policy tests passed, the build produced `dist/`, release
`ded8b26b2a83efd1` verified, and 20/20 browser tests passed. Every one of the 14
commands in `.factory/claims.json` was also run separately and passed.

## What remains

Resolve F-2-1 through F-2-10 in `.factory/review-2.md`, deploy the exact repair,
then rerun the full review against production. In particular, add production-
surface coverage: the current Vite test masks the static 404, and the current
license test mocks a valid token without checking the advertised checkout.
