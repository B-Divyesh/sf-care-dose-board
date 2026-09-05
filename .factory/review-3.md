# Review 3 — Track each dose for an older relative

## Verdict

**PASS**

Finding count: **0**. Untested claim count: **0**.

Reviewed on 2026-09-05 at <https://care-dose-board.sociobot.in>.

- Implementation reviewed: `0da36dc30aed60aa7fe0b4e9d77d0b0eb49db3e8`
- Documentation reviewed: `30bcbdcb2f63e02b726bea4822be16ed10dead59`
- Live release: `4b8ddcd1b99b7856`

The implementation SHA and documentation SHA differ only because the later
commit adds verification documentation. No product code was changed for this
review.

## Job, audience, and first action

Fresh Chromium contexts at 390×844 and 1440×900 showed the same first screen
before scrolling.

| Check | Result |
| --- | --- |
| Job | Track each dose for an older relative. |
| Audience | Families sharing care for an older relative. |
| First action | Try it with sample data. It opens a filled board and says nothing is saved. |
| Three facts | Data stays on this device; works offline; three dose statuses. All were visible. |

## Sample and data isolation

On both live browser profiles, one click opened Meera’s realistic three-dose
board. The persistent label said **Demo — sample data, nothing is saved**.
Changing the blood-pressure dose to skipped worked. **Reset demo** restored
given. **Start for real** left the demo.

A separate fresh live profile created a real medication called “Review real
tablet,” entered demo mode, changed and reset a sample record, then left demo.
The real board still held only Review real tablet; the sample was discarded.
The real board used the `dose-witness` browser database and the demo session
key was absent after exit. The disposable profile was then closed.

## Checks

From a fresh clone at documentation SHA `30bcbdc`, with the documented Node
20+ setup and `npm ci` (0 vulnerabilities), these checks passed:

| Command or check | Result |
| --- | --- |
| `npm test` | PASS — 4 files, 9 tests |
| `npm run build` | PASS — created `dist/` |
| `npm run verify:release` | PASS — release `4b8ddcd1b99b7856` |
| `npm run test:e2e` | PASS — 21 browser tests |
| All 14 exact commands in `.factory/claims.json` | PASS — each ran separately |
| Fresh live phone and desktop exercise | PASS — no console or page errors |
| Fresh live Axe scans | PASS — 0 serious or critical issues on 8 routes |

The 14 separately run claim commands covered: status recording,
single-visible-record, demo-isolation, device-only, offline-reload,
encrypted-handoff, merge-resolution, no-paid-checkout, print-handoff,
route-metadata, accessible-use, installable-pwa, product-boundaries, and
release-package. Each manifest claim has one tagged observable browser test;
there are no missing, false, incomplete, or untested public claims.

Normal recording, required-field errors, boundary times, corrections, refresh
persistence, encrypted export/import, wrong-passphrase recovery, offline
reload, and an offline record all pass in the declared browser suite. The
product is a static local-first PWA, so backend tenant isolation, restart,
health, and 429 checks do not apply. It is not a CLI, library, or desktop
artifact.

## Site, accessibility, privacy, and recovery

- `/`, `/demo`, `/medications`, `/handoff`, `/settings`, `/privacy`, and
  `/terms` returned 200 with one h1, one main landmark, distinct title, and
  canonical URL. The deliberate unknown route returned the expected designed
  HTTP 404 with its own title and canonical URL.
- A live Axe scan found no serious or critical issue on those seven routes or
  the 404. Keyboard skip focus, route focus, dialogs, reduced motion, 390 px,
  and 200% text are covered by the passing browser tests.
- The live demo reload worked offline after service-worker control. Its
  recorded requests stayed on the product origin. The privacy and terms pages
  are present and explain local storage, encrypted handoffs, deletion, and
  medical limits.
- The live response has CSP, Permissions-Policy, HSTS, nosniff, and strict
  referrer policy. `robots.txt` and `sitemap.xml` are present.
- The rendered-site link crawl found 13 same-site addresses. Twelve returned
  200. The remaining 404 was the deliberate page’s own skip link with a
  `#main-content` fragment; it correctly stays on the designed 404 and is not
  a broken user path.

## Earlier findings

All earlier findings were rechecked. Their current disposition is fixed:

| Earlier report | Current proof |
| --- | --- |
| Verification 1 | Skip focus, immutable asset caching, release cache name, CSP, and Permissions-Policy pass. |
| Verification 2 | The deployed implementation matches the release build. |
| Review 1 B1–B4 | The first screen is clear; the sample is isolated; claims are tested; unknown paths show a designed 404. |
| Review 1 M1–M6 | Landing structure, metadata, route focus, artwork target, phone layout, and footer pass. |
| Review 1 C-L01–C-L13, C-R01–C-R25, U-L01–U-L12, U-R01–U-R32 | Current landing and README copy is plain and each remaining public promise is in the claims manifest. |
| Review 2 F-2-1 | The phone sample label and controls remain visible after scrolling. |
| Review 2 F-2-2 | The unavailable payment promise and artificial medication limit were removed; a fourth medication works without checkout. |
| Review 2 F-2-3 and F-2-5 | The live 404 has complete metadata, standard header, footer, publisher, and build label. |
| Review 2 F-2-4 | The artwork destination clears the sticky phone header. |
| Review 2 F-2-6 | All three facts are in the first phone and desktop viewport. |
| Review 2 F-2-7 through F-2-10 | README wording is plain; storage, deployment, and removed billing wording no longer contain the cited jargon or unavailable promise. |
| Verification 3 and verification 4 | Their zero-finding paths remain green in this clean and live review. |

## Evidence

- `/work/.evidence/review-3-phone-first.png`
- `/work/.evidence/review-3-phone-demo.png`
- `/work/.evidence/review-3-desktop-first.png`
- `/work/.evidence/review-3-desktop-demo.png`
