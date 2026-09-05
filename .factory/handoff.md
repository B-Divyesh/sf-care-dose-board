# Dose Witness — repair 2 handoff

## Result

**PASS.** This repair resolves every finding in `.factory/review-2.md`.

Implementation SHA: `0da36dc30aed60aa7fe0b4e9d77d0b0eb49db3e8`

The deployed implementation is the same SHA. The later documentation commit is
separate so the deployed product revision stays identifiable.

## What changed

- Kept the demo notice sticky on phones below the header. Its label, reset, and
  exit controls stay visible after scrolling and each control is at least 44 px.
- Put the three plain facts directly after the first action, before the artwork.
- Removed the unavailable paid limit, price, checkout link, license storage,
  license verification, and external API permission. A fourth medication now
  adds without a purchase path.
- Completed the real static 404 with description, canonical, Open Graph,
  Twitter, icon links, wordmark header, legal footer, publisher, and a
  build-version stamp. The local browser suite now uses `scripts/serve-dist.mjs`
  so it tests the actual HTTP 404 behavior.
- Offset the artwork target below the sticky phone header and added a visual
  target-position assertion.
- Rewrote the four flagged README sections in plain words and updated the copy
  audit and demo guide.

## Verification

Clean setup used `npm ci`. These commands passed:

```sh
npm test                 # 9 unit/policy tests
npm run build            # writes dist/
npm run verify:release   # release 4b8ddcd1b99b7856
npm run test:e2e         # 21 browser tests
```

Each of the 14 exact claim commands in `.factory/claims.json` was then run
separately and passed.

The built static preview passed `/opt/fleet/lib/verify-url.sh`: no console
errors, title/lang, one h1/main, and complete image alt text. The standalone
`@axe-core/cli` could not start because this container has no system Chrome.
The shipped Playwright Axe integration ran instead on every app route and the
HTTP 404 at desktop and 390 px; it found zero serious or critical violations.

Live verification after deployment:

- `https://care-dose-board.sociobot.in/` returned 200. Its HTML exactly matched
  `dist/index.html` by SHA-256.
- An unknown live URL returned HTTP 404. Its document exactly matched
  `dist/404.html` and had the expected metadata, header, footer, and build id.
- Fresh desktop and phone visits had no app console errors. Before scrolling,
  the job was “Track each dose for an older relative,” the audience was families
  sharing care, and the first action was “Try it with sample data.”
- The 390 px first screen showed all three facts. The one-click sample showed
  three dose cards; its banner stayed at y=65 directly below the 65 px header.
  Reset restored the given sample record. Exiting demo left a real test board
  unchanged.
- Live Playwright Axe scans covered `/`, `/demo`, `/medications?demo=1`,
  `/handoff?demo=1`, `/settings?demo=1`, `/privacy`, `/terms`, and the 404 at
  desktop and phone sizes. All serious/critical counts were zero.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100. FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0.

## Known dependency

The central Sociobot catalog does not currently enable a hosted checkout for
this product. To avoid a dead purchase promise, this release offers every
medication card without a paid limit. If a one-time license returns, first
enable the real catalog product, then add the hosted checkout and a non-charging
checkout contract test before advertising a price.
