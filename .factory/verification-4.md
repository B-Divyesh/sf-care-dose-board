# Track each dose for an older relative — verification 4

## Verdict

**PASS**

Finding count: **0**. Untested claim count: **0**.

Verified on 2026-09-05 against the live product at
<https://care-dose-board.sociobot.in>.

- Implementation reviewed: `0da36dc30aed60aa7fe0b4e9d77d0b0eb49db3e8`
- Documentation reviewed: `c0f271da6393782c0aab77874df7c0b7210059d0`
- Live release: `4b8ddcd1b99b7856`

The only repository change between the implementation and documentation SHAs
is `.factory/handoff.md`. All 21 deployable files from a clean build matched
production byte-for-byte. The later documentation commit does not require a
different product image.

## First screen before scrolling

Fresh Chromium profiles were used at 390×844 and 1440×900.

| Question | Phone and desktop answer |
| --- | --- |
| Job | **Track each dose for an older relative.** |
| Audience | Families sharing care for an older relative. |
| First action | **Try it with sample data.** It opens a filled board and says nothing is saved. |

Both first screens also showed all three facts before scrolling: data stays on
this device, the app works offline, and it records three dose statuses.

## Live product exercise

The one-click sample opened Meera’s board with three realistic cards: a blood
pressure tablet given by AK, calcium marked uncertain by RJ with a note, and an
evening tablet awaiting a record. The persistent label said **Demo — sample
data, nothing is saved**. On phone and desktop, that label and both 44 px or
larger controls stayed visible after scrolling.

Changing the first sample to skipped worked. **Reset demo** restored it to
given. The demo used only `demo:dose-witness` in session storage. The real
IndexedDB `primary` record remained empty, all requests stayed on the product
origin, and **Start for real** opened an empty board without sample cards.

Normal, invalid, boundary, and recovery paths passed in a separate disposable
browser profile:

- Empty required medication fields were rejected.
- `00:00`, `23:59`, and a duplicate `00:00` created two unique dose cards.
- Lowercase initials became `QA`.
- An uncertain record was corrected to skipped. Reload kept the current record
  and both activity entries.
- A short export passphrase was rejected.
- The encrypted file did not contain the medication name.
- A wrong import passphrase showed a recoverable error. The correct passphrase
  imported the file.

The disposable profile was destroyed after the check. No existing household
data was read or changed.

## Declared claims

Each exact command from `.factory/claims.json` ran separately in a clean
checkout at documentation SHA `c0f271d`. Every command passed.

| Claim | Result | Observed proof |
| --- | --- | --- |
| `status-recording` | PASS | Given, skipped, uncertain, initials, and notes were recorded. |
| `single-visible-record` | PASS | One current card remained while correction history kept both events. |
| `demo-isolation` | PASS | Reset and exit worked; the real board did not receive sample data. |
| `device-only` | PASS | Demo storage was session-only and all requests were same-origin. |
| `offline-reload` | PASS | A fresh controlled demo reloaded and accepted a status while offline. |
| `encrypted-handoff` | PASS | Ciphertext hid names and imported with the passphrase. |
| `merge-resolution` | PASS | Unique records remained and newer conflicts won. |
| `no-paid-checkout` | PASS | A fourth medication was added with no checkout or off-origin request. |
| `print-handoff` | PASS | The summary included statuses, notes, and corrections and invoked print. |
| `route-metadata` | PASS | Titles, canonicals, focus, Back, artwork target, and HTTP 404 passed. |
| `accessible-use` | PASS | Keyboard, reduced motion, 200% text, 390 px, and Axe checks passed. |
| `installable-pwa` | PASS | Manifest, maskable icon, release cache, and worker control passed. |
| `product-boundaries` | PASS | The app records care and offers no medical decision action. |
| `release-package` | PASS | Static build, security policy, MIT license, and local artwork passed. |

Landing copy, README, legal copy, and interface labels were cross-checked
against the manifest. No public claim is missing, false, incomplete, or
untested.

## Clean checkout and release checks

The clean checkout used the documented setup, `npm ci`, with Node 22 and the
repository-pinned Playwright 1.58.2. It found zero package vulnerabilities.

| Check | Result |
| --- | --- |
| `npm test` | PASS — 4 files, 9 tests |
| `npm run build` | PASS — `dist/` created |
| `npm run verify:release` | PASS — release `4b8ddcd1b99b7856` |
| `npm run test:e2e` | PASS — 21 browser tests |
| 14 exact claim commands | PASS — 14 of 14 |
| Factory URL verifier | PASS — no console errors; title, lang, h1, main, labels, and alt text present |
| Playwright Axe | PASS — 0 serious or critical issues on all app routes and the 404 |
| Live mobile Lighthouse | PASS — 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO |

The initial JavaScript is 39,933 bytes and CSS is 17,721 bytes. The AVIF,
WebP, and JPEG hero files are 26,184, 33,258, and 66,501 bytes. These meet the
declared static-product budgets. Lighthouse measured FCP 1.0 s, LCP 1.2 s,
TBT 120 ms, CLS 0, and Speed Index 1.0 s.

## Accessibility, privacy, offline, and site structure

- Keyboard skip navigation moved focus to main. Route changes and Back focused
  the new h1. Escape closed dialogs and returned focus in the browser suite.
- The 390 px layout had no horizontal overflow. The bottom dock did not cover
  tested actions. Browser-test text at 200% remained usable.
- Reduced-motion transitions were `0.01ms`. There is no looping or flashing
  motion. The visual thesis explicitly uses one dark treatment.
- Every tested page had `lang=en`, one h1, one main landmark, labelled controls,
  visible focus, and no serious or critical Axe result. Lighthouse accessibility
  scored 100.
- `/`, `/demo`, `/medications`, `/handoff`, `/settings`, `/privacy`, and
  `/terms` returned 200 with distinct titles and canonicals. Every discovered
  internal link returned 200.
- The unknown route returned the expected HTTP 404. It had the designed page,
  metadata, wordmark, legal links, publisher, build label, and route home.
- The privacy page explains stored data, encrypted files, deletion through
  browser site settings, and the privacy contact. The terms state the medical
  limits and caregiver responsibility.
- Live demo traffic stayed same-origin. There are no analytics, ads, third-party
  scripts, fonts, cloud care storage, checkout calls, or background sync.
- Offline reload and offline status recording passed live. The install manifest
  uses standalone display, 192/512 icons, and a maskable icon. The live cache
  is `dose-witness-shell-4b8ddcd1b99b7856`; the browser suite also proved old
  Dose Witness caches are removed on update.
- Live headers include CSP, Permissions-Policy, HSTS, nosniff, and strict
  referrer policy. Hashed assets are immutable for one year; HTML and the
  manifest revalidate; the worker uses no-store.

This is a static local-first PWA. Backend tenant isolation, backend restart
persistence, health endpoints, and HTTP 429 handling do not apply. CLI,
library, and desktop-install checks also do not apply.

## Earlier findings

Every finding in `.factory/verification.md`, `.factory/verification-2.md`,
`.factory/review-1.md`, and `.factory/review-2.md` was checked again.

| Earlier finding | Current disposition and proof |
| --- | --- |
| Verification 1: skip focus | Fixed. Live Tab and Enter focused `#main-content`. |
| Verification 1: immutable caching | Fixed. Live hashed JS/CSS return one-year immutable caching. |
| Verification 1: release cache name | Fixed. Clean and live cache names use release `4b8ddcd1b99b7856`. |
| Verification 1: CSP and Permissions-Policy | Fixed. Both are present on live responses. |
| Verification 2: deployed candidate mismatch | Fixed. All 21 deployable clean-build files match live bytes. |
| Review 1 B1 | Fixed. Job, audience, and one first sample action are clear. |
| Review 1 B2 | Fixed. One-click realistic demo, persistent label, reset, exit, and storage isolation passed. |
| Review 1 B3 | Fixed. Fourteen claims and fourteen uniquely tagged tests passed separately. |
| Review 1 B4 | Fixed. Unknown live paths return a designed HTTP 404. |
| Review 1 M1 | Fixed. Landing order includes preview, three steps, boundaries, privacy, and footer. No paid tier is advertised. |
| Review 1 M2 | Fixed. All app routes and 404 have complete, distinct metadata. |
| Review 1 M3 | Fixed. Real routes, Back, h1 focus, and route announcements are covered. |
| Review 1 M4 | Fixed. The artwork target is focused and visible below the phone header. |
| Review 1 M5 | Fixed. Phone and 200% text checks found no covered action under the dock. |
| Review 1 M6 | Fixed. Every route, including 404, shows Param Factory and the build label. |
| Review 1 copy findings C-L01–C-L13 | Fixed. Current landing audit has no long, banned, vague, metaphorical, or inconsistent line. |
| Review 1 copy findings C-R01–C-R25 | Fixed. The README was rewritten in plain words; the current audit has no flag. |
| Review 1 unlisted claims U-L01–U-L12 and U-R01–U-R32 | Fixed. Current claims are removed or mapped to the 14 passing manifest tests. |
| Review 2 F-2-1 | Fixed. The phone demo label and controls stayed visible after real scrolling. |
| Review 2 F-2-2 | Fixed honestly. The unavailable purchase promise, limit, license code, and checkout were removed. A fourth medication works. |
| Review 2 F-2-3 | Fixed. The live HTTP 404 has description, canonical, social metadata, and icons. |
| Review 2 F-2-4 | Fixed. The phone artwork target clears the sticky header. |
| Review 2 F-2-5 | Fixed. The live 404 has the standard header and complete footer. |
| Review 2 F-2-6 | Fixed. All three facts are in the first phone and desktop viewport. |
| Review 2 F-2-7 | Fixed. README says “app updates” and “page titles and links.” |
| Review 2 F-2-8 | Fixed. README uses “Try the sample safely” and visible privacy results. |
| Review 2 F-2-9 | Fixed. README deployment copy states the results in short sentences. |
| Review 2 F-2-10 | Fixed. The billing paragraph was removed with the unavailable paid feature. |

Verification 3 reported no findings. Its covered behavior remains green in the
present clean and live runs.

## Remaining external dependency

The Sociobot catalog still has no enabled checkout for this product. The live
product makes no paid promise and imposes no artificial medication limit, so
this is not a product finding. A paid tier should return only after a real
catalog entry and a non-charging checkout contract test exist.

## Evidence

- `/work/.evidence/live-qa-4.json`
- `/work/.evidence/screenshots/`
- `/work/.evidence/verify-url/`
- `/work/.evidence/lighthouse-live.json`

