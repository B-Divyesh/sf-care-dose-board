# Dose Witness — perfection-loop repair handoff

## Result

**PASS.** All four blocking findings and all six major findings in `.factory/review-1.md` are resolved. The repaired static PWA is live at <https://care-dose-board.sociobot.in/>. The isolated sample is live at <https://care-dose-board.sociobot.in/demo>.

Product repair commit: `bdc843fcc3860e027bbb3ab87aad1953e4b07377`. Production routing fix: `24a7517608f52b29c45ee7a9bb13562466a346e0`.

## What changed

- Replaced the cold-start heading with “Track each dose for an older relative.” The lede now names families sharing care and the three dose statuses.
- Made **Try it with sample data** the primary first action. **Set up my board** is the only secondary setup action.
- Added a filled `/demo` and `/?demo=1` board for Meera. It includes a given morning dose, an uncertain dose with a factual note, and an unrecorded evening dose.
- Added the persistent demo banner, **Reset demo**, and **Start for real**. Demo state uses only the `demo:dose-witness` `sessionStorage` key and never opens the real `dose-witness` IndexedDB database.
- Added `.factory/claims.json` with 14 product claims and exactly one `@claim:<id>` browser test for each claim.
- Added real `/medications`, `/handoff`, `/settings`, `/privacy`, `/terms`, and `/demo` paths. Push, Back, and Forward navigation focus the new h1 and announce the route.
- Fixed `/settings#about-art` so it scrolls to and focuses **Privacy and purpose**.
- Added route-specific titles, descriptions, canonicals, Open Graph and Twitter metadata, a 1200×630 product-art preview, and a 180×180 Apple touch icon.
- Added both client and static 404 pages. Known app paths rewrite to the app; unknown paths return the designed page with HTTP 404.
- Added the full landing sequence: product preview, three steps, safety and privacy limits, exact free/$19 terms, legal links, publisher, and build id.
- Increased mobile bottom clearance, verified 200% text, and removed secondary hero copy on phones before allowing the dock to cover content.
- Named dialogs for assistive technology and corrected paper-card action contrast.
- Hardened service-worker precaching by injecting hashed build assets. Offline reload now uses populated responses and rejected 404 responses cannot replace the cached shell.
- Rewrote the README and landing copy from the review, standardized terminology, and recorded the audit in `.factory/copy-audit.md`.
- Kept the original night-watch visual identity. The social image is a crop of the existing original artwork; `.factory/design.md` records that derivation.
- Updated the catalog line to: “Track each medication dose for an older relative on one private household board.”

## Exact verification evidence

### Final working tree and clean clone

At commit `24a7517608f52b29c45ee7a9bb13562466a346e0`:

- `npm test`: **9/9 passed** across 4 files.
- `npm run build`: **passed**; `dist/index.html` exists.
- Build output: JS **45.06 KB raw / 14.13 KB gzip**; CSS **17.53 KB raw / 4.66 KB gzip**.
- `npm run verify:release`: **passed**, release `ded8b26b2a83efd1`.
- `npm run test:e2e`: **20/20 passed** in mobile Chromium, including 14 claim tests.
- `git diff --check`: **passed**.

A fresh clone at `/tmp/tmp.te3lLJCPNY/repo` ran `npm ci`, `npm test`, `npm run build`, and `npm run verify:release`. Every command in `.factory/claims.json` was then run separately. All 14 passed:

`status-recording`, `single-visible-record`, `demo-isolation`, `device-only`, `offline-reload`, `encrypted-handoff`, `merge-resolution`, `three-medication-license`, `print-handoff`, `route-metadata`, `accessible-use`, `installable-pwa`, `product-boundaries`, and `release-package`.

### Browser, accessibility, privacy, and performance

- Playwright axe scans found **0 serious or critical violations** on `/`, `/demo`, `/privacy`, and `/terms`.
- Keyboard tests passed for the skip link, dialogs, route focus, Back navigation, and the About target.
- The 390×844 test passed at 200% root text size with no horizontal overflow or dock-obscured main action.
- The privacy claim intercepted the complete demo edit and handoff flow. Every request was same-origin and demo mode created no IndexedDB databases.
- The offline claim reloaded `/demo` with the browser offline and recorded a dose successfully.
- Local `verify-url.sh` reported no console errors, one h1, one main, no missing alt text, and no unlabeled buttons.
- Lighthouse 13 mobile: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**; LCP **1,659 ms**, CLS **0**, TBT **0 ms**.
- Local evidence is in `.factory/evidence/local/`.

### Deployment and live checks

- Factory static deployment succeeded to Azure Static Web Apps. Deployment id: `6101db10-2329-488d-be1e-94e241f97b98`.
- Default host: `gentle-moss-04d14c30f.7.azurestaticapps.net`.
- Custom domain status: **Ready**.
- Live `/`, `/demo`, `/medications`, `/handoff`, `/settings`, `/privacy`, and `/terms`: **HTTP 200**.
- Live `/not-a-real-route-review`: **HTTP 404** with title `Not found — Dose Witness`.
- Live `/` verification: no console errors; title and language present; one h1 and one main; zero missing alt attributes; zero unlabeled buttons.
- Live `/demo` verification: title `Demo — Dose Witness`; no console errors; one h1 and one main; zero missing alt attributes; zero unlabeled buttons.
- Live screenshots and verifier reports are in `.factory/evidence/live/` and `.factory/evidence/live-demo/`.

## How to verify

```sh
npm ci
npm test
npm run build
npm run verify:release
npm run test:e2e
```

Run every individual claim command exactly as listed in `.factory/claims.json`.

## Known gaps

No blocking or major review finding remains. Automated purchase coverage mocks a valid Sociobot license response; it does not make a real charge. The existing checkout remains the hosted Sociobot billing endpoint.
