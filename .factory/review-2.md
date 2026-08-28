# Dose Witness — adversarial first-read review 2

**Verdict: FAIL**

Reviewed 2026-08-28 at <https://care-dose-board.sociobot.in/> from fresh
Chromium contexts at 390×844 and 1440×900. Repository and deployed release:
`d6d1da08c4b12ae0454ca7211a771e2938117690` (`main`). The built root and
404 documents matched production byte-for-byte. Product code was not modified.

There are **5 blocking, 1 major, and 4 minor findings**. The clean-clone tests
pass, but production still has a disappearing mobile demo banner, a dead paid
checkout, incomplete 404 structure, and several half-fixed earlier findings.

## Cold first screen, before scrolling

My first-read answers were the same at 390 px and desktop:

- **What it does:** records whether each scheduled medication dose was given,
  skipped, or uncertain.
- **For whom:** families sharing care for an older relative.
- **What to click first:** **Try it with sample data** to see a filled board
  without saving anything.

The exact text that supplied those answers was “Track each dose for an older
relative,” “For families sharing care, record whether each scheduled medication
was given, skipped, or uncertain,” and “Try it with sample data,” followed by
“See a filled dose board; nothing is saved.” This part is clear and is not a
blocking finding.

At 390×844, however, none of the three promised plain facts was visible before
scrolling. The viewport ended during “Show the next caregiver what happened.”
That separate structure defect is F-2-6.

## Findings, ordered by severity

### BLOCKING F-2-1 — the demo banner disappears on the one-click phone path (repeat of B2)

**Quote/location:** `/demo`, “Demo — sample data, nothing is saved”; “Reset
demo”; “Start for real.” In `src/styles.css`, the phone rule changes
`.demo-banner` from `position: sticky` to `position: relative`.

**Evidence:** after clicking **Try it with sample data** at 390×844, route focus
scrolled the page to `scrollY=250`. The banner occupied y=-186 to -62, so none
of it or its controls was visible. At desktop it remained sticky at y=76–137.
Scrolling a direct mobile `/demo` load also moved both controls fully above the
viewport.

**Why this fails the first-time visitor:** the sample itself is realistic and
already in use, but the phone visitor immediately loses the notice that changes
are disposable. Reset and exit are also hidden. The required persistent safety
context from review-1 B2 is therefore only half-fixed.

**Concrete fix:** keep a compact sticky demo bar on phones, below the sticky
header or above the bottom dock. Keep both controls at least 44 px high. Add a
390 px test that enters from the landing action, scrolls to the last dose, and
asserts the banner, **Reset demo**, and **Start for real** remain visible and
operable.

### BLOCKING F-2-2 — “Buy household unlock” is a dead link and its claim test bypasses checkout

**Quote/location:** `/settings`, “Buy household unlock”; landing, “A $19
one-time household license allows unlimited active medications.”

**Evidence:** the link points to
`https://api.sociobot.in/api/v1/products/care-dose-board/checkout`. A fresh GET
returned HTTP 404 with `{"error":"enabled factory product","status":404}`.
The `three-medication-license` claim test passed only because it mocks the
verification API and pastes `valid-test-license`; it never opens the checkout
link or proves a visitor can buy the advertised license.

**Why this misleads a visitor:** the landing page offers a purchasable $19
upgrade, but the only purchase action ends on an API error.

**Concrete fix:** enable the product in the Sociobot billing catalog and make
the link resolve to a working hosted checkout, or remove the price and purchase
action until it exists. Extend `@claim:three-medication-license` with a
non-charging contract test that verifies the checkout URL returns the expected
hosted page or redirect; keep the mocked license-restoration assertion as a
separate check.

### BLOCKING F-2-3 — the production 404 has no route metadata (repeat of M2)

**Quote/location:** live `/not-a-real-route-review`, title “Not found — Dose
Witness.” The response contains no meta description, canonical link, Open
Graph fields, or favicon.

**Why this misleads a visitor:** the static host serves `public/404.html`, while
the passing local `@claim:route-metadata` test sees Vite’s SPA fallback. The
claim “Real routes provide distinct titles, canonical metadata … and a
not-found page” is false for the actual not-found response. This is the
remaining half of review-1 M2.

**Concrete fix:** give `404.html` the same description, canonical, Open Graph,
Twitter, favicon, Apple-touch, and theme metadata as the app shell, with the
not-found title and description. Add a deployment-level test that serves
`dist/` with the production 404 rules and asserts the returned HTTP 404
document, rather than testing only Vite fallback behavior.

### BLOCKING F-2-4 — “Read artwork details” focuses a heading hidden behind the phone header (repeat of M4)

**Quote/location:** landing/footer link “Read artwork details”; target
`/settings#about-art`, heading “Privacy and purpose.”

**Evidence:** at 390×844 the URL and focus were correct, but the target heading
occupied y=-2 to 23 while the sticky header ended at y=65. No part of the
heading was actually visible below the header. At desktop the heading was
visible.

**Why this loses a first-time visitor:** the declared target technically gains
focus, but the visual destination is hidden. Review-1 M4 required the target to
be scrolled into view as well as focused, so the fix is incomplete.

**Concrete fix:** add a scroll margin at least equal to the phone header plus
spacing, or scroll to a safe offset after rendering. Strengthen the route test
to assert `target.getBoundingClientRect().top >= header.bottom`, not only URL
and focus.

### BLOCKING F-2-5 — the production 404 omits the required footer (repeat of M6)

**Quote/location:** live `/not-a-real-route-review`. It has only “404 · Not
found,” “This page does not exist,” and “Return to today’s board.” There is no
Privacy link, Terms link, “Built by Param Factory,” or build id; it also has no
site header.

**Why this matters:** review-1 M6 required ownership and build information on
every route. The app-rendered routes now have it, but the production 404 route
does not, so the earlier finding remains half-fixed.

**Concrete fix:** render the standard wordmark header and footer in
`404.html`, including Privacy, Terms, publisher, and build id. Generate or
stamp the static 404 during the build so its build id cannot drift.

### MAJOR F-2-6 — the three plain facts are below the first screen

**Quote/location:** landing, “Data stays on this device,” “Works offline,” and
“Three dose statuses.”

**Evidence:** none appeared before scrolling at 390×844 or 1440×900. On the
phone, the first viewport instead entered the next hero section. This does not
prevent answering what/for whom/first click, but it misses the mandatory
first-screen shape.

**Concrete fix:** move the three facts directly below the first action and
before the large artwork section. Use a compact mobile treatment that keeps all
three visible without shrinking text or controls.

### MINOR F-2-7 — the README uses test jargon

**Quote/location:** README: “They cover keyboard focus, offline reloads, worker
updates, and route metadata.”

**Why it slows a reader:** “worker updates” and “route metadata” require web
platform knowledge.

**Proposed rewrite:** “They cover keyboard focus, offline reloads, app updates,
and page titles and links.”

### MINOR F-2-8 — the README’s demo explanation uses storage jargon

**Quote/location:** heading “Demo sandbox”; “`/demo` and `/?demo=1` open
realistic sample data in the `demo:dose-witness` session namespace”; “Demo
actions never read or write the real `dose-witness` database.”

**Why it slows a reader:** “sandbox,” “session namespace,” and “database” name
implementation concepts instead of the visible privacy result.

**Proposed rewrite:** heading “Try the sample safely.” Then: “`/demo` and
`/?demo=1` open realistic sample data only in that browser tab. Demo actions
never read or write the saved household board.”

### MINOR F-2-9 — the README deployment paragraph is unnecessarily dense

**Quote/location:** “static site”; “app URLs”; “security headers”; “versioned
assets”; “release id.”

**Why it slows a reader:** the paragraph stacks build-system terms before
stating their results.

**Proposed rewrite:** “Deploy `dist/` as the website. The host sends known app
addresses to `index.html` and unknown addresses to `404.html`.
`staticwebapp.config.json` sets browser security rules. It avoids stale app
files and caches files whose names change with their contents. The build
creates a unique label from its complete output.”

### MINOR F-2-10 — the README billing paragraph uses internal platform terms

**Quote/location:** “Sociobot billing API”; “product slug”; “payment-provider
credentials or product IDs.”

**Why it slows a reader:** these phrases describe integration internals rather
than the security boundary.

**Proposed rewrite:** “Checkout and license checks only contact Sociobot. The
checkout product name comes from this repository. The repository contains no
payment-provider secrets or product identifiers.”

## Copy audit

Counts are whitespace-delimited after Markdown is removed; hyphenated terms
count as one word. Headings, labels, links, buttons, and meaningful alt text are
included because the plain-words checklist explicitly covers them. No item
exceeds 22 words, no banned marketing adjective appears, terminology is
consistent, and landing actions use result-naming verbs. `—` means no flag.

### Live landing page

| # | Words | Exact copy | Flag |
|---|---:|---|---|
| L01 | 4 | Skip to dose board | — |
| L02 | 2 | Dose Witness | — |
| L03 | 2 | One dose. | — |
| L04 | 3 | One visible record. | — |
| L05 | 1 | Today | — |
| L06 | 1 | Medications | — |
| L07 | 1 | Handoff | — |
| L08 | 1 | Settings | — |
| L09 | 3 | Household medication record | — |
| L10 | 7 | Track each dose for an older relative | — |
| L11 | 14 | For families sharing care, record whether each scheduled medication was given, skipped, or uncertain. | — |
| L12 | 5 | Try it with sample data | — |
| L13 | 4 | Set up my board | — |
| L14 | 8 | See a filled dose board; nothing is saved. | — |
| L15 | 3 | One visible record | — |
| L16 | 6 | Show the next caregiver what happened | — |
| L17 | 10 | Add the medications and times from the current care plan. | — |
| L18 | 9 | Record each dose with a status and caregiver initials. | — |
| L19 | 12 | Illustration of three caregivers linking their status marks to one dose record | — |
| L20 | 5 | Data stays on this device | — |
| L21 | 6 | No account or cloud care record. | — |
| L22 | 2 | Works offline | — |
| L23 | 6 | Record a dose without a signal. | — |
| L24 | 3 | Three dose statuses | — |
| L25 | 4 | Given, skipped, or uncertain. | — |
| L26 | 2 | Live preview | — |
| L27 | 5 | See a filled dose board | — |
| L28 | 6 | 7:30 AM · Blood pressure tablet | — |
| L29 | 3 | Given by AK | — |
| L30 | 5 | 1:00 PM · Calcium tablet | — |
| L31 | 6 | Uncertain · note for next caregiver | — |
| L32 | 5 | 8:30 PM · Evening tablet | — |
| L33 | 3 | Awaiting a record | — |
| L34 | 4 | Open this sample board | — |
| L35 | 3 | How it works | — |
| L36 | 4 | Keep one household record | — |
| L37 | 4 | Add the care plan | — |
| L38 | 8 | Copy medication names and times from current instructions. | — |
| L39 | 3 | Record each dose | — |
| L40 | 8 | Choose given, skipped, or uncertain and add initials. | — |
| L41 | 4 | Brief the next caregiver | — |
| L42 | 9 | Print a summary or send an encrypted handoff file. | — |
| L43 | 2 | Safety boundary | — |
| L44 | 2 | Records care. | — |
| L45 | 4 | Never gives medical advice. | — |
| L46 | 14 | Dose Witness does not check interactions, change prescriptions, recommend dosages, or contact a pharmacy. | — |
| L47 | 3 | Read the terms | — |
| L48 | 1 | Storage | — |
| L49 | 6 | Care data stays in this browser | — |
| L50 | 11 | The app has no accounts, analytics, ads, or background cloud sync. | — |
| L51 | 3 | You control exports. | — |
| L52 | 4 | Read the privacy policy | — |
| L53 | 2 | Household license | — |
| L54 | 2 | Start free. | — |
| L55 | 6 | Remove the medication limit for $19. | — |
| L56 | 7 | The free board allows three active medications. | — |
| L57 | 9 | A $19 one-time household license allows unlimited active medications. | — |
| L58 | 3 | View license details | — |
| L59 | 4 | Not a medical device. | — |
| L60 | 16 | Dose Witness records household care; it does not give medical advice or replace a clinician’s instructions. | — |
| L61 | 3 | Read artwork details | — |
| L62 | 1 | Privacy | — |
| L63 | 1 | Terms | — |
| L64 | 4 | Built by Param Factory | — |
| L65 | 2 | Build v1.1.0 | — |

### README

| # | Words | Exact copy | Flag |
|---|---:|---|---|
| R01 | 2 | Dose Witness | — |
| R02 | 16 | Dose Witness keeps a medication record on one device for families caring for an older relative. | — |
| R03 | 11 | It records whether each scheduled dose was given, skipped, or uncertain. | — |
| R04 | 11 | It also records caregiver initials and notes for the next caregiver. | — |
| R05 | 5 | It keeps a household record. | — |
| R06 | 6 | It is not a medical device. | — |
| R07 | 13 | It does not provide dosage advice, interaction checks, prescription changes, or pharmacy services. | — |
| R08 | 3 | Live product: https://care-dose-board.sociobot.in | — |
| R09 | 5 | Try the isolated sample: https://care-dose-board.sociobot.in/demo | — |
| R10 | 3 | Dose Witness features | — |
| R11 | 10 | Enter daily medication cards from the household’s current care plan. | — |
| R12 | 9 | Record a status, caregiver initials, and an optional note. | — |
| R13 | 10 | See corrections and overdue doses, then print a caregiver summary. | — |
| R14 | 12 | Store records in this browser without an account, analytics, or cloud storage. | — |
| R15 | 12 | Encrypt handoff files and keep the latest record when devices are merged. | — |
| R16 | 10 | Install the app and continue recording after the connection drops. | — |
| R17 | 6 | Use three active medications for free. | — |
| R18 | 8 | A $19 one-time household license removes that limit. | — |
| R19 | 14 | Use the app by keyboard or screen reader, with reduced motion and browser zoom. | — |
| R20 | 10 | Read the privacy policy at /privacy and terms at /terms. | — |
| R21 | 11 | Every product promise is listed in .factory/claims.json with one browser test. | — |
| R22 | 2 | Run locally | — |
| R23 | 7 | Use Node.js 20 or newer and npm. | — |
| R24 | 7 | Open the local address printed by Vite. | — |
| R25 | 8 | The browser keeps app data under that address. | — |
| R26 | 3 | Test and build | — |
| R27 | 9 | Run one documented claim with its command from .factory/claims.json. | — |
| R28 | 2 | For example: | — |
| R29 | 10 | The build writes the static site to dist/, including dist/index.html. | — |
| R30 | 6 | Preview it with npm run preview. | — |
| R31 | 11 | The browser tests cover adding a medication and recording a status. | — |
| R32 | 11 | They cover keyboard focus, offline reloads, worker updates, and route metadata. | F-2-7 |
| R33 | 13 | They also check legal pages, console errors, and serious or critical accessibility findings. | — |
| R34 | 5 | Data ownership and device handoff | — |
| R35 | 12 | The browser saves all care plan and dose data on this device. | — |
| R36 | 10 | The app does not sync care data in the background. | — |
| R37 | 17 | Download an encrypted handoff file, send the passphrase separately, then import the file on the other device. | — |
| R38 | 7 | Import keeps records unique to both devices. | — |
| R39 | 12 | It uses the newest timestamp when the same record changed on both. | — |
| R40 | 7 | The app cannot recover an export passphrase. | — |
| R41 | 6 | Keep a printed or encrypted backup. | — |
| R42 | 8 | Clearing browser site data removes the local board. | — |
| R43 | 2 | Demo sandbox | F-2-8 |
| R44 | 12 | /demo and /?demo=1 open realistic sample data in the demo:dose-witness session namespace. | F-2-8 |
| R45 | 10 | Demo actions never read or write the real dose-witness database. | F-2-8 |
| R46 | 4 | Reset restores the sample. | — |
| R47 | 11 | Start for real discards the demo and opens the real board. | — |
| R48 | 8 | See .factory/demo.md for sample details and verification steps. | — |
| R49 | 1 | Deployment | — |
| R50 | 6 | Deploy dist/ as a static site. | F-2-9 |
| R51 | 13 | The host routes known app URLs to index.html and unknown URLs to 404.html. | F-2-9 |
| R52 | 5 | staticwebapp.config.json defines the security headers. | F-2-9 |
| R53 | 9 | It prevents stale app files while caching versioned assets. | F-2-9 |
| R54 | 10 | The build creates a release id from the complete output. | F-2-9 |
| R55 | 8 | npm run verify:release recomputes and checks that id. | — |
| R56 | 10 | Checkout and license verification use only the Sociobot billing API. | F-2-10 |
| R57 | 7 | The product slug comes from this repository. | F-2-10 |
| R58 | 8 | No payment-provider credentials or product IDs are embedded. | F-2-10 |
| R59 | 4 | Artwork and design sources | — |
| R60 | 11 | The colors, type, artwork source, and image-generation notes are in .factory/design.md. | — |
| R61 | 10 | The source artwork and its generation prompt are in assets/src/. | — |
| R62 | 1 | License | — |
| R63 | 4 | MIT — see LICENSE. | — |

## Demo, storage, offline, and privacy evidence

- The one-click demo immediately showed three realistic records: a blood
  pressure tablet given by AK, a calcium tablet marked uncertain by RJ with a
  note, and an evening tablet awaiting a record.
- Changing the blood pressure tablet to skipped and using **Reset demo**
  restored it to given. **Start for real** removed the demo key.
- A pre-existing real medication remained after entering and leaving demo;
  sample data did not appear on the real board.
- A fresh demo flow created only the `demo:dose-witness` `sessionStorage` key
  and no IndexedDB databases.
- The complete live demo edit and handoff flow made five requests, all to
  `https://care-dose-board.sociobot.in`. There were no off-origin or failed
  requests.
- After the service worker controlled the page, offline reload kept the sample
  and its edited note available.

The isolation, Reset, exit, request-log privacy, and offline behaviors pass.
F-2-1 concerns the missing persistent phone notice and controls.

## Claims audit

Clean clone: `/tmp/tmp.07z790V8yh/repo`, exact SHA `d6d1da0`. `npm ci`,
`npm test` (9/9), `npm run build`, and `npm run verify:release` passed. Every
command in `.factory/claims.json` was run separately:

| Claim id | Exact test | Clean result | Live cross-check |
|---|---|---|---|
| status-recording | `npm run test:claims -- --grep @claim:status-recording` | PASS | Confirmed |
| single-visible-record | `npm run test:claims -- --grep @claim:single-visible-record` | PASS | Confirmed |
| demo-isolation | `npm run test:claims -- --grep @claim:demo-isolation` | PASS | Confirmed after completed real save |
| device-only | `npm run test:claims -- --grep @claim:device-only` | PASS | Confirmed by request log and empty demo IndexedDB list |
| offline-reload | `npm run test:claims -- --grep @claim:offline-reload` | PASS | Confirmed offline on live `/demo` |
| encrypted-handoff | `npm run test:claims -- --grep @claim:encrypted-handoff` | PASS | Test evidence accepted |
| merge-resolution | `npm run test:claims -- --grep @claim:merge-resolution` | PASS | Test evidence accepted |
| three-medication-license | `npm run test:claims -- --grep @claim:three-medication-license` | PASS | **Contradicted by dead live checkout; F-2-2** |
| print-handoff | `npm run test:claims -- --grep @claim:print-handoff` | PASS | Test evidence accepted |
| route-metadata | `npm run test:claims -- --grep @claim:route-metadata` | PASS | **Contradicted by production 404; F-2-3** |
| accessible-use | `npm run test:claims -- --grep @claim:accessible-use` | PASS | Live axe and viewport checks confirmed |
| installable-pwa | `npm run test:claims -- --grep @claim:installable-pwa` | PASS | Live worker controlled offline page |
| product-boundaries | `npm run test:claims -- --grep @claim:product-boundaries` | PASS | Confirmed |
| release-package | `npm run test:claims -- --grep @claim:release-package` | PASS | Built root and 404 matched live bytes |

The complete `npm run test:e2e` run also passed 20/20. No additional
claim-like landing or README sentence lacks a manifest entry. The problem is
that two listed tests do not exercise the production surface their claims
cover, leaving those public claims false despite green local commands.

## Earlier finding recheck

Every finding from `.factory/review-1.md` was checked live and in source.
There are no `polish-*.md` files. The repair handoff was also read.

| Earlier id | Result now | Evidence |
|---|---|---|
| B1 | Fixed | First screen names the job, family audience, and one sample action. |
| B2 | **Half-fixed; BLOCKING again as F-2-1** | Demo is realistic and isolated, but its required persistent phone banner disappears. |
| B3 | Fixed | Claims manifest has 14 unique entries and 14 unique tagged tests; all commands passed. |
| B4 | Fixed | Unknown production URL returns HTTP 404 with the designed h1 and a route home. |
| M1 | Fixed | Landing follows preview, three steps, boundaries/privacy, exact price, then footer. |
| M2 | **Half-fixed; BLOCKING again as F-2-3** | App routes have metadata; the production static 404 does not. |
| M3 | Fixed | Push navigation and Back both focus the new h1; direct routes return 200. |
| M4 | **Half-fixed; BLOCKING again as F-2-4** | URL and focus are correct, but the phone header hides the target. |
| M5 | Fixed | No 390 px overflow; tested main actions can clear the bottom dock, including at 200% test text size. |
| M6 | **Half-fixed; BLOCKING again as F-2-5** | App routes have publisher/build footer; production 404 does not. |

## Site structure, links, accessibility, and identity

- `/`, `/demo`, `/medications`, `/handoff`, `/settings`, `/privacy`, and
  `/terms` returned 200 with distinct titles, one h1, one main, descriptions,
  canonicals, Open Graph image, favicon, header, footer, Privacy, and Terms.
- Push navigation and Back restored the correct route and focused h1.
- Every discovered internal link returned 200. The one dead external action is
  the Sociobot checkout in F-2-2.
- The unknown route returned the intended HTTP 404, but has the metadata and
  skeleton failures in F-2-3 and F-2-5.
- Live axe scans found zero serious or critical issues on all seven app routes
  and the 404. There was no horizontal overflow at 390 px. Reduced motion was
  honored. Fresh cold pages produced no app console errors.
- The night-watch palette, clipped paper dose slips, condensed display type,
  status lighting, and original bedside-board art are recognizably specific to
  this product. It is not a generic centered SaaS hero or three-icon template.

## Missed leverage

No additional feature finding is warranted. The brief explicitly asks for
encrypted export/import rather than background sync, and the product includes
both import/export and printing. An AI step would add risk to a factual
medication record and is not implied by the job; no decorative AI or provider
key is present. Runtime billing uses only Sociobot, although its checkout route
must be enabled as described in F-2-2.

## What would make this perfect

1. Keep the demo banner and both controls visible throughout the 390 px demo.
2. Make the Sociobot checkout work and test the non-charging checkout contract.
3. Give the real HTTP 404 full route metadata and the standard header/footer.
4. Offset the artwork anchor below the sticky phone header and test visibility.
5. Put the three plain facts in the first viewport.
6. Replace the four README jargon clusters with the proposed plain wording.

After those fixes, rerun every clean claim command and the entire checklist
against the deployed host. A PASS requires no remaining item in this section.
