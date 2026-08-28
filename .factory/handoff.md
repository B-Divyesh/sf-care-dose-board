# Dose Witness — adversarial review handoff

## Result

**FAIL** on 2026-08-28 against
<https://care-dose-board.sociobot.in/> and repository baseline
`265b935043a013a9a36e021765690da1abb24f72`.

The detailed first-read, copy, demo, claims, routing, metadata, accessibility,
and link review is in `.factory/review-1.md`. Product code was not modified.

## What was done

- Opened the live product cold in fresh 390×844 and 1440×900 Chromium
  contexts and recorded only what was visible before scrolling.
- Audited every landing-page and README copy unit with word counts, jargon,
  terminology, heading, and action-label findings.
- Checked `/demo` and `?demo=1`, wrote a disposable local browser record, and
  proved that it appeared at `/` in the same real IndexedDB namespace.
- Checked for `.factory/claims.json`, `.factory/demo.md`, and `@claim:` tests;
  none exist.
- Exercised offline reload and captured all requests during a create/record
  flow. The real board remained available offline and made no off-origin
  requests in that flow.
- Checked route titles, metadata, direct links, Back behavior, focus, a bogus
  route, internal HTTP targets, mobile hit testing, console errors, and axe
  serious/critical results.
- Confirmed the visual direction is distinct and matches `.factory/design.md`.

## How it was verified

A clean clone at `/tmp/care-dose-review.oCRprq` passed:

```sh
npm ci
npm test
npm run build
npm run verify:release
npx playwright install chromium
npm run test:e2e
```

Results: 8/8 unit/release tests, a successful `dist/` build, release
`ba116c2f1e543442`, and 7/7 Playwright tests. Live axe scans found zero
serious/critical issues on the tested routes, and cold loads had zero console
errors. Screenshots are in `/tmp/dose-mobile.png` and
`/tmp/dose-desktop.png` in this disposable container.

## Blocking gaps and next steps

1. Rewrite the first screen to name the family-care audience and present one
   primary sample-data action.
2. Build `/demo` with realistic seeded data, a persistent banner, Reset and
   Start-for-real actions, offline support, and storage isolated from the real
   board. Document it in `.factory/demo.md`.
3. Add `.factory/claims.json` and exactly one tagged observable test per public
   claim; remove or rewrite untestable claims.
4. Add a designed Not Found route and correct unknown-path handling.
5. Complete route metadata, real paths, h1 focus/announcement, footer build
   identity, the broken About target, and mobile dock spacing.

Do not accept the current deployment based only on the passing legacy test
suite: it does not cover the factory demo or claims contracts.
