# Dose Witness — adversarial first-read review 1

**Verdict: FAIL**

Reviewed 2026-08-28 at <https://care-dose-board.sociobot.in/> from fresh
Chromium contexts at 390×844 and 1440×900. Repository baseline:
`265b935043a013a9a36e021765690da1abb24f72` (`main`). Product code was not
modified.

The result has **4 blocking findings**. A pass requires zero blocking findings
and no more than three minor findings.

## Cold first screen, before scrolling

My first-read answers were:

- **What it does:** a board where a caregiver records whether scheduled
  medicine was given, skipped, or uncertain.
- **For whom:** not determinable from the first screen. “Shared” and
  “caregiver” imply several people, but the screen never says that this is for
  families caring for an older relative.
- **What to click first:** not determinable as one action. “＋ Add medication”
  and “Add the first medication” duplicate each other, while “How handoff
  works” competes with them. There is no sample-data action.

At 390 px, the first viewport contained the headline, lede, both medication
actions, and part of “How handoff works.” The fixed bottom navigation covered
that button: its center point resolved to the Handoff navigation link. At
1440 px the same copy appeared with the original night-watch artwork.

## Findings, ordered by severity

### BLOCKING B1 — the first screen does not identify the audience or one first action

**Quote:** “Today’s dose board”; “A shared, factual record of what was
given—not another reminder”; “＋ Add medication”; “Add the first medication”;
“How handoff works.”

**Why this loses a first-time visitor:** the headline names an object, not the
job. “Shared” does not say who shares it, and two duplicate setup actions plus
a third explanatory action do not establish one next click. The audience from
the brief—families caring for an older relative—is absent.

**Concrete fix:** use `Track each dose for an older relative` as the h1; use
`For families sharing care, record whether each scheduled medication was
given, skipped, or uncertain.` as the lede; make `Try it with sample data` the
single primary action, with `See a filled dose board; nothing is saved.` beside
it. Keep `Set up my board` as the secondary real-data action.

### BLOCKING B2 — there is no demo, and conventional demo entry points write real data

**Quote:** the landing actions are “＋ Add medication,” “Add the first
medication,” and “How handoff works.” There is no “Try it with sample data.”

**Evidence:** fresh visits to `/demo` and `/?demo=1` both rendered the same
empty “Today’s dose board.” They had no sample records, demo banner, `Reset
demo`, or `Start for real`. Writing “Review sample tablet” at `/?demo=1`
created the sole IndexedDB database, `dose-witness`; opening `/` in the same
context showed that record. Demo data therefore entered the real namespace.

**Why this loses or misleads a visitor:** the product cannot be evaluated in
one click, and a verifier who guesses the conventional demo URL can alter the
visitor’s real board while believing it is disposable.

**Concrete fix:** add a first-screen `Try it with sample data` link to `/demo`.
Seed a realistic board (for example: morning medication given by AK, one
uncertain dose with a factual note, and one upcoming dose). Show a persistent
`Demo — sample data, nothing is saved` banner with `Reset demo` and `Start for
real`. Use a separate `demo:dose-witness` database/store or in-memory state;
never read or write `dose-witness` while the banner is present. Add
`.factory/demo.md` and tests proving reset, exit, offline availability, and
real-data isolation.

### BLOCKING B3 — the required claims manifest and claim-tagged tests do not exist

**Quote:** “Works offline”; “Stored only on this device”; README: “AES-256-GCM
encrypted export/import with timestamp-based merging between devices.”

**Evidence:** `.factory/claims.json` is absent. A repository-wide search found
zero `@claim:` tags. There were therefore zero declared claim commands to run
from the clean clone. The ordinary tests passed, but they cannot substitute for
the required claim inventory because they do not enumerate or tag each public
promise.

**Why this misleads a visitor:** the page and README make privacy, offline,
encryption, accessibility, pricing, merge, and deployment promises without a
reviewable mapping to observable tests.

**Concrete fix:** create `.factory/claims.json`; give each claim below exactly
one `@claim:<id>` test; run every entry against `/demo` from fresh state. At
minimum test offline reload, demo isolation, same-origin-only care-data
requests, encrypted export/import, merge resolution, three-medication limit,
printing, route metadata, and the stated accessibility behaviors.

### BLOCKING B4 — unknown URLs silently become the real board instead of a designed 404

**Quote:** requesting `/not-a-real-route-review` returned HTTP 200 with h1
“Today’s dose board” and title “Today — Dose Witness.”

**Why this loses a visitor:** a mistyped or stale link looks valid and can lead
someone to enter care data in the wrong place. It also makes dead-link checks
produce false positives.

**Concrete fix:** render a product-styled Not Found route with h1 `This page
does not exist`, title `Not found — Dose Witness`, and a `Return to today’s
board` link. Configure the host to return 404 for unknown non-app paths where
supported, and add a direct-navigation test.

### MAJOR M1 — the standard landing structure is missing

**Quote:** after the empty-state hero, the page jumps to three promise lines
and the footer.

**Why this loses a visitor:** there is no live sample, three-step “How it
works,” plain statement of limitations/privacy, or visible $19 tier before the
footer. The price appears only under “More.”

**Concrete fix:** retain the distinctive night-watch art but order the page as
header, clear first screen, live demo preview, three concrete steps, limits and
privacy, exact free/$19 terms, then footer.

### MAJOR M2 — route metadata is incomplete and the root title uses the wrong pattern

**Quote:** root title “Today — Dose Witness”; `/demo` title “Today — Dose
Witness.” The document has no canonical URL, Open Graph fields, Twitter card,
or Apple touch icon.

**Why this misleads a visitor:** browser history and shared links do not say
what the product does, `/demo` is indistinguishable, and link previews lack the
product’s own identity.

**Concrete fix:** use `Dose Witness — record household medication doses` at
`/`, `Demo — Dose Witness` at `/demo`, and route-specific description and
canonical tags. Add Open Graph/Twitter fields, a 1200×630 image based on the
night-watch art, and a 180 px Apple touch icon. Preserve the working SVG
favicon, `lang="en"`, theme color, one h1, and one main landmark.

### MAJOR M3 — navigation does not focus or announce the new page

**Quote:** app navigation uses `/#medications`, `/#handoff`, and `/#settings`.
After clicking Medications, focus moved to `<main>`, not its h1. After Back and
after clicking Privacy, focus was on `<body>`.

**Why this loses a visitor:** a keyboard or screen-reader user receives no
reliable page-start cue, and hash fragments are being used as application
routes rather than in-page anchors.

**Concrete fix:** use real routes such as `/medications`, `/handoff`, and
`/settings`; on push, back, and forward, focus a `tabindex="-1"` h1 and
announce its title through a polite live region. Add direct-load and Back/
Forward focus tests.

### MAJOR M4 — the “About section” link does not reach its declared target

**Quote:** the link declares `href="#about-art"`, but clicking it changes the
URL to `/#settings`; the About panel remained 739 px below the viewport.

**Why this loses a visitor:** the visible link promises a section target but
lands at the settings view without showing or focusing that section.

**Concrete fix:** route to `/settings#about-art`, then scroll and focus the
`Privacy and purpose` heading. Test the final URL, visible target, and focus.

### MAJOR M5 — the 390 px navigation obscures content

**Quote:** “How handoff works” occupied y=766–814 while the fixed mobile dock
covered the same area; the button center hit the “Handoff” nav link.

**Why this loses a visitor:** a visible control is not the control a touch
activates. It happens to lead to the same view today, but the overlap is still
an incorrect hit target and can hide other content.

**Concrete fix:** add bottom padding equal to the dock plus safe-area inset and
verify every interactive element can be scrolled fully above the dock at
390×844 and 200% text size.

### MAJOR M6 — the footer omits required ownership and build information

**Quote:** the footer contains “Not a medical device,” “Privacy,” and “Terms,”
but no “Built by Param Factory” or version/build id.

**Why this matters:** a visitor cannot identify the publisher or the deployed
build when reporting a medication-record problem.

**Concrete fix:** add `Built by Param Factory` and the release id next to the
existing legal links on every route.

## Copy audit

Counts are whitespace-delimited words after Markdown is removed; a hyphenated
term counts as one word. The landing table includes visible text, navigation,
image alt text, and loading/noscript fallback text. Code blocks are excluded
from the README table. `—` means no copy-rule flag. Every flagged row is a
finding and includes its proposed replacement.

### Live landing page

| # | Words | Exact copy | Flag / proposed rewrite |
|---|---:|---|---|
| L01 | 4 | Skip to dose board | — |
| L02 | 2 | Dose Witness | — |
| L03 | 2 | One dose. | — |
| L04 | 3 | One visible record. | — |
| L05 | 1 | Today | — |
| L06 | 1 | Medications | — |
| L07 | 1 | Handoff | — |
| L08 | 1 | More | **C-L01:** destination is vague. Rewrite: `Settings`. |
| L09 | 3 | Friday, August 28 | — |
| L10 | 3 | Today’s dose board | — |
| L11 | 10 | A shared, factual record of what was given—not another reminder. | **C-L02:** “shared” and “factual” are vague; audience missing. Rewrite: `For families sharing care, record what happened at each scheduled dose.` |
| L12 | 2 | Add medication | **C-L03:** duplicates L17 and competes with the required demo. Remove it from the first screen; use `Set up my board` once as the secondary action. |
| L13 | 4 | Start the night watch | **C-L04:** metaphorical heading fails out of context. Rewrite: `Set up the dose board`. |
| L14 | 5 | Make the next handoff unambiguous. | **C-L05:** “handoff” is unexplained and “unambiguous” is an outcome adjective. Rewrite: `Show the next caregiver what happened.` |
| L15 | 10 | Add the medicines and times from the existing care plan. | **C-L06:** “medicines” conflicts with “medication.” Rewrite: `Add the medications and times from the current care plan.` |
| L16 | 15 | When a dose is due, a caregiver records given, skipped, or uncertain with their initials. | — |
| L17 | 4 | Add the first medication | —; this is a result-naming verb, but it should follow the demo action. |
| L18 | 3 | How handoff works | **C-L07:** button is not a result-naming verb. Rewrite: `View a sample handoff`. |
| L19 | 15 | An illustrated night-time household dose board where three caregiver marks converge on one witnessed check | **C-L08:** “caregiver marks” and “witnessed check” are abstract. Rewrite: `Illustration of three caregivers linking their status marks to one dose record.` |
| L20 | 3 | Private by default | **C-L09:** vague marketing/privacy claim. Rewrite and merge with L21: `Data stays on this device.` |
| L21 | 5 | Stored only on this device. | —, subject to a claim test. |
| L22 | 2 | Works offline | —, subject to a claim test. |
| L23 | 5 | Record care without a signal. | —, subject to a claim test. |
| L24 | 2 | Honest states | **C-L10:** “honest” is a marketing adjective. Rewrite: `Three dose statuses`. |
| L25 | 4 | Given, skipped, or uncertain. | — |
| L26 | 4 | Not a medical device. | — |
| L27 | 16 | Dose Witness records household handoffs; it does not give medical advice or replace a clinician’s instructions. | — |
| L28 | 7 | Generated scene disclosed in the About section. | **C-L11:** passive and production-focused. Rewrite: `See how the artwork was made.` |
| L29 | 2 | About section | **C-L12:** does not name the result and the target is broken. Rewrite: `Read artwork details`. |
| L30 | 1 | Privacy | — |
| L31 | 1 | Terms | — |
| L32 | 2 | Opening Dose Witness… | — |
| L33 | 9 | Your private dose board is loading on this device. | — |
| L34 | 12 | Dose Witness needs JavaScript to keep its encrypted, local-first board on this device. | **C-L13:** “local-first” is jargon. Rewrite: `Dose Witness needs JavaScript to store the encrypted dose board on this device.` |

No landing sentence exceeds 22 words and none uses a specifically banned word.

### README

| # | Words | Exact copy | Flag / proposed rewrite |
|---|---:|---|---|
| R01 | 2 | Dose Witness | — |
| R02 | 16 | Dose Witness is a private, local-first medication handoff board for families caring for an older relative. | **C-R01:** “local-first” and “handoff board” are jargon. Rewrite: `Dose Witness keeps a medication record on one device for families caring for an older relative.` |
| R03 | 23 | It records whether each scheduled dose was given, skipped, or uncertain, who witnessed that status, and what the next caregiver needs to know. | **C-R02:** exceeds 22 words and carries two ideas. Rewrite: `It records whether each scheduled dose was given, skipped, or uncertain. It also records initials and notes for the next caregiver.` |
| R04 | 9 | It is a coordination utility, not a medical device. | **C-R03:** “coordination utility” is jargon. Rewrite: `It keeps a household record. It is not a medical device.` |
| R05 | 13 | It does not provide dosage advice, interaction checking, prescription changes, or pharmacy services. | — |
| R06 | 3 | Live product: https://care-dose-board.sociobot.in | — |
| R07 | 3 | What it includes | **C-R04:** heading is unclear out of context. Rewrite: `Dose Witness features`. |
| R08 | 10 | Daily medication cards generated from an existing household care plan | **C-R05:** “generated” suggests automatic import, but users enter them. Rewrite: `Daily medication cards entered from the household’s current care plan`. |
| R09 | 10 | Explicit status recording with caregiver initials and optional handoff notes | **C-R06:** noun-heavy and “handoff” is unexplained. Rewrite: `Record a status, caregiver initials, and an optional note for the next caregiver`. |
| R10 | 10 | Visible correction history, past-due context, and a printable shift handoff | **C-R07:** “past-due context” and “shift handoff” are jargon. Rewrite: `See corrections and overdue doses, then print a caregiver summary`. |
| R11 | 9 | IndexedDB persistence with no account, analytics, or cloud storage | **C-R08:** implementation jargon. Rewrite: `Stores records in this browser without an account, analytics, or cloud storage`. |
| R12 | 8 | AES-256-GCM encrypted export/import with timestamp-based merging between devices | **C-R09:** acronym-heavy. Rewrite: `Encrypts exported files and keeps the latest record when devices are merged`. |
| R13 | 9 | Installable PWA shell that reloads and continues recording offline | **C-R10:** “PWA shell” is jargon. Rewrite: `Install the app and continue recording after the connection drops`. |
| R14 | 17 | A useful free board for three active medications; a $19 one-time household license unlocks unlimited active medications | **C-R11:** “useful” is marketing and the sentence combines price and limits. Rewrite: `The free board allows three active medications. A $19 one-time license removes that limit.` |
| R15 | 8 | Keyboard, screen-reader, reduced-motion, 390px mobile, and print treatments | **C-R12:** “treatments” does not name outcomes. Rewrite: `Supports keyboard and screen-reader use, reduced motion, 390 px screens, and printing`. |
| R16 | 5 | Plain-language /privacy and /terms pages | **C-R13:** “plain-language” is a self-assessed adjective. Rewrite: `Includes /privacy and /terms pages`. |
| R17 | 2 | Run locally | — |
| R18 | 7 | Requirements: Node.js 20 or newer and npm. | — |
| R19 | 7 | Open the local URL printed by Vite. | — |
| R20 | 8 | Browser data is stored only for that origin. | **C-R14:** “origin” is web-platform jargon. Rewrite: `The browser keeps app data under that local site address.` |
| R21 | 3 | Test and build | — |
| R22 | 8 | The production command is exactly npm run build. | — |
| R23 | 12 | It writes the static deployment to dist/, with dist/index.html at its root. | — |
| R24 | 34 | The browser suite covers a complete mobile medication/status/handoff path, keyboard skip-focus behavior, a prior-worker release update with stale-cache cleanup, an offline reload with preserved IndexedDB data, legal routes, console errors, and serious/critical axe findings: | **C-R15:** exceeds 22 words and is jargon-heavy. Rewrite as three bullets: `The browser tests cover adding a medication and recording a status.` `They cover keyboard focus, offline reloads, and worker updates.` `They also check legal pages, console errors, and serious or critical accessibility findings.` |
| R25 | 5 | Preview the built app with: | — |
| R26 | 5 | Data ownership and device handoff | — |
| R27 | 9 | All care-plan and dose data is saved in IndexedDB. | **C-R16:** “care-plan” conflicts with “care plan”; IndexedDB is unexplained. Rewrite: `The browser saves all care plan and dose data on this device.` |
| R28 | 7 | There is intentionally no background cloud synchronization. | **C-R17:** “intentionally” adds no information. Rewrite: `The app does not sync data in the background.` |
| R29 | 19 | Use Handoff → Download encrypted copy, share that file, communicate the passphrase separately, and import it on another device. | **C-R18:** “communicate” is formal and the transfer term changes again. Rewrite: `Download an encrypted handoff file, send the passphrase separately, then import the file on the other device.` |
| R30 | 20 | Import keeps records unique to both devices and uses the newest timestamp when the same record was changed on both. | — |
| R31 | 7 | The app cannot recover an export passphrase. | — |
| R32 | 15 | Keep an appropriate printed or encrypted backup; clearing browser site data removes the local board. | **C-R19:** two ideas in one sentence. Rewrite: `Keep a printed or encrypted backup. Clearing browser site data removes the local board.` |
| R33 | 1 | Deployment | — |
| R34 | 14 | Deploy the contents of dist/ as a static site with SPA fallback to index.html. | **C-R20:** “SPA fallback” is unexplained jargon. Rewrite: `Deploy dist/ as a static site and route app URLs to index.html.` |
| R35 | 18 | staticwebapp.config.json ships the required CSP, Permissions-Policy, revalidation for HTML/worker/manifest, and long-lived immutable caching only for hashed assets/ files. | **C-R21:** dense security/cache jargon. Rewrite as: `staticwebapp.config.json defines the security headers. It prevents stale app files while caching versioned assets.` |
| R36 | 26 | The release build derives the service-worker cache namespace and installed-app version query from the complete release content; npm run verify:release independently recomputes and checks that stamp. | **C-R22:** exceeds 22 words and combines two implementation details. Rewrite: `The build creates a release id from the complete output. npm run verify:release recomputes and checks that id.` |
| R37 | 10 | Checkout and license verification use only the Sociobot billing API. | — |
| R38 | 17 | The product slug is derived from this repository and no payment-provider credentials or product IDs are embedded. | — |
| R39 | 3 | Design and provenance | **C-R23:** “provenance” is jargon. Rewrite: `Artwork and design sources`. |
| R40 | 12 | The product-specific night-market visual system and generated-asset provenance are documented in .factory/design.md. | **C-R24:** “visual system” and “generated-asset provenance” are specialist terms. Rewrite: `The colors, type, artwork source, and image-generation notes are in .factory/design.md.` |
| R41 | 10 | The original source artwork and prompt sidecar live in assets/src/. | **C-R25:** “sidecar” is jargon. Rewrite: `The source artwork and its generation prompt are in assets/src/.` |
| R42 | 1 | License | — |
| R43 | 4 | MIT — see LICENSE. | — |

Terminology is inconsistent across the audited copy: `medicine` / `medication`,
`care plan` / `care-plan`, `encrypted copy` / `export` / `handoff file`, and
`household license` / `household unlock`. Use `medication`, `care plan`,
`encrypted handoff file`, and `household license` consistently.

## Unlisted claim findings

Because `.factory/claims.json` is missing, every claim below is unlisted. Each
row is a separate finding. Duplicate promises may share one claim id once the
manifest exists, but every location must appear in that entry’s `where` field.

### Landing claims

| ID | Exact unlisted claim | Concrete fix |
|---|---|---|
| U-L01 | “One visible record.” | Add `single-visible-record`; test that one scheduled dose resolves to one current card plus correction history. |
| U-L02 | “A shared, factual record of what was given—not another reminder.” | Remove “factual” and test the observable status record; do not imply cross-device sharing. |
| U-L03 | “Make the next handoff unambiguous.” | Remove the untestable outcome adjective; state the fields shown to the next caregiver. |
| U-L04 | “When a dose is due, a caregiver records given, skipped, or uncertain with their initials.” | Add `status-recording`; assert all three statuses and initials from demo data. |
| U-L05 | “Private by default.” | Replace with the specific storage/network behavior and map it to `device-only`. |
| U-L06 | “Stored only on this device.” | Add `device-only`; intercept the complete demo flow and assert no care data leaves the origin. |
| U-L07 | “Works offline.” | Add `offline-reload`; load `/demo`, go offline, reload, and edit a sample status. |
| U-L08 | “Record care without a signal.” | Map this location to `offline-reload`. |
| U-L09 | “Honest states.” | Remove “honest”; it is not measurable. |
| U-L10 | “Given, skipped, or uncertain.” | Map this location to `status-recording`. |
| U-L11 | “Dose Witness records household handoffs; it does not give medical advice or replace a clinician’s instructions.” | Add a static/product-boundary check and a recording-flow test; retain the safety disclaimer. |
| U-L12 | “Generated scene disclosed in the About section.” | Add an asset/provenance check or reduce this to a link label after fixing its target. |

### README claims

| ID | Exact unlisted claim | Concrete fix |
|---|---|---|
| U-R01 | “Dose Witness is a private, local-first medication handoff board for families caring for an older relative.” | Map the specific device-storage behavior to `device-only`; remove “local-first.” |
| U-R02 | “It records whether each scheduled dose was given, skipped, or uncertain, who witnessed that status, and what the next caregiver needs to know.” | Map to `status-recording` and assert notes appear in Handoff. |
| U-R03 | “It is a coordination utility, not a medical device.” | Add the product-boundary check and split the copy. |
| U-R04 | “It does not provide dosage advice, interaction checking, prescription changes, or pharmacy services.” | Add `non-goals`; statically assert these features/claims are absent from routes and calls. |
| U-R05 | “Daily medication cards generated from an existing household care plan” | Rewrite “entered,” then test that entered schedules create the correct daily cards. |
| U-R06 | “Explicit status recording with caregiver initials and optional handoff notes” | Map to `status-recording`. |
| U-R07 | “Visible correction history, past-due context, and a printable shift handoff” | Add separate tests for correction history, overdue state, and print content. |
| U-R08 | “IndexedDB persistence with no account, analytics, or cloud storage” | Add `device-only`; assert IndexedDB persistence and intercept all demo requests. |
| U-R09 | “AES-256-GCM encrypted export/import with timestamp-based merging between devices” | Add encryption round-trip/content checks and an e2e merge-conflict test. |
| U-R10 | “Installable PWA shell that reloads and continues recording offline” | Add installability manifest checks and map offline behavior to `offline-reload`. |
| U-R11 | “A useful free board for three active medications; a $19 one-time household license unlocks unlimited active medications” | Remove “useful”; test the three-item limit, displayed price, and valid-license unlock. |
| U-R12 | “Keyboard, screen-reader, reduced-motion, 390px mobile, and print treatments” | Split into measurable claims; add keyboard, axe, reduced-motion, overflow/touch, and print assertions. |
| U-R13 | “Plain-language /privacy and /terms pages” | Remove “plain-language” or define a measurable readability rule; test both routes. |
| U-R14 | “Requirements: Node.js 20 or newer and npm.” | Add a CI runtime matrix/check or state the actually supported tested version. |
| U-R15 | “Browser data is stored only for that origin.” | Map to `device-only` and test storage/network boundaries. |
| U-R16 | “The production command is exactly npm run build.” | Add a build claim that runs this command in a clean checkout. |
| U-R17 | “It writes the static deployment to dist/, with dist/index.html at its root.” | Extend the build claim to assert the directory and entry file. |
| U-R18 | “The browser suite covers a complete mobile medication/status/handoff path, keyboard skip-focus behavior, a prior-worker release update with stale-cache cleanup, an offline reload with preserved IndexedDB data, legal routes, console errors, and serious/critical axe findings.” | Split the sentence and tag the existing observable tests; add missing demo and route-focus coverage. |
| U-R19 | “All care-plan and dose data is saved in IndexedDB.” | Map to `device-only`; inspect the expected database from a clean demo context. |
| U-R20 | “There is intentionally no background cloud synchronization.” | Intercept requests while idle and during every demo action; assert no sync endpoint is called. |
| U-R21 | “Use Handoff → Download encrypted copy, share that file, communicate the passphrase separately, and import it on another device.” | Add a browser download/import round trip using demo data. |
| U-R22 | “Import keeps records unique to both devices and uses the newest timestamp when the same record was changed on both.” | Add a two-state merge test that asserts unique records and the exact winning timestamp. |
| U-R23 | “The app cannot recover an export passphrase.” | Test that no passphrase/recovery material enters storage or requests; keep the operational warning. |
| U-R24 | “Keep an appropriate printed or encrypted backup; clearing browser site data removes the local board.” | Split the advice from the claim and test storage clearing. |
| U-R25 | “Deploy the contents of dist/ as a static site with SPA fallback to index.html.” | Add a preview/deep-link build test; also add real unknown-route handling. |
| U-R26 | “staticwebapp.config.json ships the required CSP, Permissions-Policy, revalidation for HTML/worker/manifest, and long-lived immutable caching only for hashed assets/ files.” | Tag the existing release-policy assertions and verify live response headers. |
| U-R27 | “The release build derives the service-worker cache namespace and installed-app version query from the complete release content; npm run verify:release independently recomputes and checks that stamp.” | Split the sentence and tag the existing release-id test. |
| U-R28 | “Checkout and license verification use only the Sociobot billing API.” | Add a static endpoint allowlist test and a mocked license-request e2e test. |
| U-R29 | “The product slug is derived from this repository and no payment-provider credentials or product IDs are embedded.” | Add a repository scan/config derivation test. |
| U-R30 | “The product-specific night-market visual system and generated-asset provenance are documented in .factory/design.md.” | Add a documentation existence/content check or treat this as non-product documentation outside the claims catalog. |
| U-R31 | “The original source artwork and prompt sidecar live in assets/src/.” | Add an asset existence check and replace “sidecar.” |
| U-R32 | “MIT — see LICENSE.” | Add a simple license-file check or omit this legal fact from the product claims catalog by documented policy. |

## Demo, sandbox, and privacy evidence

- `/demo`: HTTP 200, but empty real board; no demo UI.
- `/?demo=1`: HTTP 200, but empty real board; no demo UI.
- Demo banner count: 0. Reset count: 0. Start-for-real count: 0.
- IndexedDB before write: only `dose-witness` version 1.
- After adding and recording “Review sample tablet” under `?demo=1`, `/`
  showed the same record: isolation failed.
- During the exercised create/record/reload flow, all 50 captured requests were
  same-origin; console errors and failed responses: 0.
- After the service worker controlled the page, a network-offline reload kept
  the entered record and showed “Offline — this board still saves on this
  device.” This verifies the real-board offline behavior, not a demo claim.

## Structure, links, identity, and accessibility

| Check | Result |
|---|---|
| Root, Privacy, Terms: one h1 and one main | Pass |
| `html lang="en"`, meta description, theme color, SVG favicon | Pass |
| Root title pattern | Fail: `Today — Dose Witness` |
| Canonical, Open Graph, Twitter card, Apple touch icon | Fail: absent |
| Designed 404 | Blocking fail: arbitrary path renders Today with 200 |
| Direct `/privacy`, `/terms`, `/#handoff`, `/#settings` | Opened the expected current views |
| Real paths for app destinations | Fail: app sections use hash routes |
| Back/forward and route-change focus | Fail: focus lands on main/body, not h1; no route-title announcement |
| Internal HTTP crawl | Root, Privacy, Terms, robots, sitemap, manifest, icons, and hero returned 200 |
| “About section” anchor | Fail: route handler discards the target |
| Consistent header/footer | Partial: present, but required builder/build id absent |
| Visual identity | Pass: dark night-watch board, clipped paper/sign language, original art, and restrained cyan/lime/amber/coral palette are recognizably product-specific rather than a generic SaaS template |
| 390 px touch/content separation | Fail: fixed dock overlaps a button |
| Serious/critical axe findings | Pass: 0 on `/`, `/privacy`, `/terms`, `/#handoff`, and `/#settings` in the exercised context |
| Keyboard skip link | Pass in clean-clone Playwright suite |
| Reduced-motion rule and visible focus CSS | Present |
| Console/load errors | Pass: 0 on cold mobile and desktop loads |

## Clean-clone command evidence

Clean clone: `/tmp/care-dose-review.oCRprq` at the stated baseline.

```text
npm ci                         PASS — 59 packages, 0 vulnerabilities
npm test                       PASS — 3 files, 8 tests
npm run build                  PASS — dist/ produced
npm run verify:release         PASS — release ba116c2f1e543442
npx playwright install chromium PASS
npm run test:e2e               PASS — 7/7 mobile Chromium tests
```

The built application JS was 37.01 kB (11.97 kB gzip), below the product and
site-structure budgets. These ordinary gates do not change the FAIL verdict:
the required claim catalog/demo contract is absent, demo-like URLs write the
real namespace, and unknown routes are not handled.

Cold screenshots were captured at `/tmp/dose-mobile.png` and
`/tmp/dose-desktop.png` during this disposable review.
