# Dose Witness — independent verification

**Result: FAIL**

Verified on 2026-08-27 against candidate commit
`19cdafc7ff4c95ccbbccb93c8438e8122848a038` and production URL
`https://care-dose-board.sociobot.in/`.

This was an independent, clean-checkout verification. Product source was not
changed.

## Release-blocking defect

### High — the keyboard skip link does not move focus to the main content

On a fresh desktop Chromium session, Tab exposes the visible **Skip to dose
board** link. Pressing Enter changes the URL to `#main-content`, but
`document.activeElement` becomes `body`, not `#main-content` (which has
`tabindex="-1"`). The next Tab returns to header navigation, so the link does
not actually let a keyboard user bypass it. This violates the explicit
keyboard/skip-link accessibility baseline. Reproduced on the candidate's
local production preview.

## Other defects

### Medium — deployment does not provide immutable caching for hashed assets

The live JS and CSS assets are content-hashed, but both return
`Cache-Control: public, must-revalidate, max-age=30`, rather than long-lived
immutable caching. This misses the static-PWA caching contract and adds
avoidable repeat-load traffic. `sw.js` appropriately has a short cache policy.

### Medium — service-worker cache namespace is not release-versioned

`public/sw.js` uses the fixed name `dose-witness-shell-v1`. The worker has
`skipWaiting`, `clientsClaim`, and an `updatefound`/Reload toast in the app,
and live offline reload works. However, the cache name itself is not tied to a
build/release revision, contrary to the PWA acceptance contract; stale shell
entries are retained in the same cache namespace across releases.

### Low — missing browser hardening policies on the live deployment

The live responses include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
and `X-Content-Type-Options: nosniff`, but do not include Content-Security-Policy
or Permissions-Policy. This does not create an observed exploit in this static
build, but a CSP is important defense in depth for an origin storing sensitive
medication records.

## Clean-checkout quality gates

Clean clone:

```text
https://github.com/B-Divyesh/sf-care-dose-board.git
19cdafc7ff4c95ccbbccb93c8438e8122848a038
```

- `npm ci`: passed; 59 packages audited, 0 vulnerabilities.
- `npm test`: passed — 2 files / 5 tests (data scheduling/merge and encrypted
  handoff round-trip/error coverage).
- `npm run build`: passed (`tsc --noEmit && vite build`); `dist/` produced.
  There is no separate lint script in `package.json`; TypeScript checking is
  part of the exact production build.
- `npx playwright install chromium && npm run test:e2e`: passed — 2/2 mobile
  Chromium tests. The first attempted run correctly reported the fresh
  environment's missing browser binary; the required browser was installed and
  the clean rerun passed.
- Built initial assets: JS 36.40 kB (11.88 kB gzip) and CSS 14.08 kB (3.93 kB
  gzip), below the 200 kB/50 kB budgets. Hero formats are 26 kB AVIF, 33 kB
  WebP, and 65 kB JPEG.
- Lighthouse on the live URL (mobile defaults): Performance 99,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, CLS
  0, interactive 1.2 s, TBT 80 ms.

## Independent functional and accessibility exercise

On the local production preview at 1440px and at 390x844px, I exercised:

- Empty state; add medication using the 00:00 boundary time; record an
  **uncertain** dose with lowercase initials and handoff note; correct it to
  **skipped**; refresh/persist; view the handoff.
- User text resembling an HTML injection (`<img src=x onerror=alert(1)>`):
  rendered as text, not markup.
- Encryption export with a valid passphrase; rejected short passphrase via
  native validation; wrong-passphrase import produced the recoverable “Could
  not open this handoff” error; correct-passphrase import merged successfully.
- Desktop and 390px layouts: no 390px horizontal overflow, bottom navigation
  present, modal fits, Escape closes it, and reduced-motion media emulation
  reduces transition durations.
- Axe via `@axe-core/playwright`: zero serious/critical findings on desktop
  empty and populated-handoff states, 390px empty state, and the repository's
  `/privacy` and `/terms` suite.
- Console: no page/console errors in the independent desktop or 390px flows.
  One `<h1>`, a `<main>`, product title, `lang="en"`, labels, and image alt
  treatment were present. The separate skip-focus defect above remains.

## Privacy, network, PWA, and deployment evidence

- First-run browser request capture made only same-origin requests; no
  analytics, third-party scripts, or outbound data requests were observed.
  Source inspection confirms IndexedDB local storage and that Sociobot is
  contacted only by the optional license flow.
- Live 390px Chromium: one h1, no console errors, no horizontal overflow;
  service worker active and controlling (`dose-witness-shell-v1`). With
  `context.setOffline(true)`, reload rendered **TODAY’S DOSE BOARD** from the
  service-worker cache.
- All 18 files in local `dist/` matched the live response byte-for-byte by
  SHA-256, including `index.html`, JS, CSS, `sw.js`, manifest, icons, art, and
  legal-route shell. The live deployment therefore matches the candidate.
- Live headers checked for `/`, hashed JS/CSS, `/sw.js`, manifest, `/privacy`,
  and `/terms`: HTTPS/HSTS, nosniff, and strict referrer policy are present;
  short `max-age=30` caching applies everywhere; CSP and Permissions-Policy
  are absent.

## Required next steps

1. Make the skip link explicitly focus `#main-content` after activation and
   cover it with a keyboard regression test.
2. Configure immutable, long-lived headers for hashed `/assets/*` files while
   retaining revalidation for HTML and `sw.js`.
3. Derive the service-worker cache name from the build/release revision and
   validate an update from an older worker state.
4. Add an appropriate CSP and Permissions-Policy at the static host.
