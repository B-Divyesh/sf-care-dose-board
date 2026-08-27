# Dose Witness — independent candidate verification 3

**Result: PASS**

Verified on 2026-08-27 from a clean detached checkout at candidate
`0c52345d379271fa03663ab85d939ba276fb72ac` against
<https://care-dose-board.sociobot.in/>. Product source was not modified.

This supersedes the earlier deployment-identity failure: that report tested
`97e8cb4`, while the present candidate contains the repaired release content.
Fresh build and live evidence both identify release `ba116c2f1e543442`.

## Acceptance result

No Critical, High, Medium, or Low defects were found. The local-first PWA
delivers the brief's smallest useful job: a household can add scheduled
medications, witness each dose as given/skipped/uncertain with initials and a
handoff note, correct the record with history retained, print a handoff, and
move the board through an encrypted export/import without an account or a
care-data network request. It correctly states that it is not a medical
device and gives no dosage recommendations.

## Clean-checkout quality gates

Clean detached worktree: `/tmp/care-dose-board-qa-0c52345`, exactly at the
SHA above.

```sh
npm ci
npm test
npm run build
npm run verify:release
npx playwright install chromium
npm run test:e2e
```

- `npm ci`: passed; 59 packages audited, **0 vulnerabilities**.
- `npm test`: passed — **3 files, 8 tests** (data scheduling/merge,
  encrypted handoff round-trip/rejection, and release-policy tests).
- Exact `npm run build`: passed (`tsc --noEmit && vite build`), producing
  `dist/`. There is no separate lint script; the available type check is part
  of the production build.
- `npm run verify:release`: passed — worker cache namespace and manifest start
  URL derive from release `ba116c2f1e543442`; immutable asset policy, CSP, and
  Permissions-Policy are asserted.
- `npm run test:e2e`: passed — **7/7** mobile Chromium tests, including skip
  focus, service-worker cache replacement/update toast, offline persisted
  handoff, static policy, and legal-page axe scans.
- Production assets: JS **37.01 kB** (11.97 kB gzip), CSS **14.18 kB**
  (3.96 kB gzip), hero AVIF/WebP/JPEG **26.2/33.3/66.5 kB**. These are below
  the 200 kB JS, 50 kB CSS, and 300 kB mobile-image budgets; no webfont is
  downloaded.

## Independent end-to-end evidence

On the built production preview at 1440×900 and 390×844, I independently:

- Added a medication whose name was `<img src=x onerror=alert(1)> Midnight
  med` at the boundary times **00:00** and **23:59** (with a duplicate 00:00).
  It rendered as literal text, created exactly two unique scheduled cards, and
  generated no script execution or console/page error.
- Recorded the past-due dose as **uncertain** with lowercase `ak` and a useful
  handoff note; the UI normalized it to `AK`. I changed it to **skipped**,
  refreshed, and verified the current witness and both audit events persisted.
- Verified invalid/recovery paths: the seven-character export passphrase was
  rejected by native validation; the encrypted export was
  `dose-witness-encrypted`, `PBKDF2-SHA-256`, 250,000 iterations, and did not
  contain the medication plaintext; a wrong-passphrase import gave the
  recoverable “Could not open this handoff” message; the correct passphrase
  merged successfully.
- Confirmed keyboard skip-link focus (visible 3px ring, Enter transfers focus
  to `#main-content`), keyboard Escape closes the modal, semantic title/lang/
  one h1/main, and no desktop console or page errors.
- Confirmed 390px has its bottom navigation, one h1, no horizontal overflow,
  and reduced motion reduces transitions to `0.00001s`.
- Ran `@axe-core/playwright` over populated desktop handoff and mobile empty
  states: **0 serious/critical findings**.
- Waited for the worker, set the context offline, and reloaded: the populated
  board and its persisted witness remained available. The release-update
  browser test also seeded an old Dose Witness cache, activated the candidate
  worker, removed the old cache, and saw the refresh toast.

## Privacy, policies, and live deployment

- Browser request capture on a first live visit saw only
  `care-dose-board.sociobot.in` (HTML, CSS, JS, app icon, artwork, and legal
  routes). No analytics, trackers, third-party fonts/scripts, or off-origin
  care-data requests occurred. Source inspection confirms IndexedDB is used
  for household data; the only off-origin endpoint is the explicit,
  user-initiated optional Sociobot license verification.
- Live desktop: one h1/main, correct title, visible 3px skip focus, zero
  console/page errors, and zero axe serious/critical findings. `/privacy` and
  `/terms` each also have one h1/main and zero serious/critical axe findings.
- Live 390px: one h1, bottom navigation, no horizontal overflow, no console
  errors, and reduced motion respected.
- Live service worker is active and controlling cache
  `dose-witness-shell-ba116c2f1e543442`; an offline reload rendered the dose
  board successfully.
- `curl -I` confirmed HTTPS/HSTS, `nosniff`, strict referrer policy, CSP
  limited to self plus the optional Sociobot API, and restrictive
  Permissions-Policy. Hashed JS/CSS are `public, max-age=31536000, immutable`;
  manifest revalidates and `sw.js` is `no-cache, no-store, must-revalidate`.
- The root HTML is byte-identical to local `dist/index.html`
  (SHA-256 `479b136d0f71a73f9dac7b05cc3dae4d41615c588ff67d4ed28ef9af3276401f`).
  All **18 deployable public artifacts** (HTML, hashed assets/source map,
  worker, manifest, icons, artwork, offline/legal shell files) matched the
  live responses byte-for-byte. `staticwebapp.config.json` is intentionally
  consumed as host configuration and is not publicly served (404); the live
  headers prove its configured policies are in effect.
- Lighthouse mobile against the live URL: **93 Performance, 100
  Accessibility, 100 Best Practices, 100 SEO**; FCP 1.1 s, LCP 1.3 s, TBT
  310 ms, CLS 0, interactive 1.5 s.

## Handoff

No remediation is required for this candidate. To repeat the checks, use the
commands in the quality-gates section, then compare a fresh `dist/` with the
live URL and exercise the PWA offline in Chromium.
