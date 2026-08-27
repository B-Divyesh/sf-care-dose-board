# Dose Witness — build handoff

Completed August 27, 2026 for work order `care-dose-board-build-1`.

## What was built

- A production Vite + TypeScript PWA with a product-specific “night-watch medicine board” visual system.
- Daily medication scheduling from the household’s existing care plan, including names, written strength, instructions, up to three daily times, pause/edit, and confirmed deletion.
- Explicit `given`, `skipped`, and `uncertain` dose records with required caregiver initials, optional handoff notes, editable status, timestamped latest state, and an append-only visible activity trail for corrections.
- Past-due context and today summary. Blank records are explicitly described as not proving a missed dose.
- IndexedDB local persistence with validation on load/import and useful blocked-storage messaging.
- Printable handoff with person name, print timestamp, daily summary, and recent witnessed activity.
- AES-256-GCM encrypted `.dosewitness` export/import. PBKDF2-SHA-256 uses 250,000 iterations; imports merge records by timestamp rather than replacing a device’s whole board.
- Offline app shell, versioned cache, navigation fallback, install manifest, 192/512/maskable icons, update notification, and offline state messaging.
- One-time Sociobot license flow: `$19` disclosure, hosted checkout link, query-token capture, local token storage, daily-cached background verification, restore-by-paste, and removal. Free use supports three active medications; recording, history, printing, export/import, accessibility, and safety copy are never gated.
- `/privacy` and `/terms` routes, not-a-medical-device positioning, MIT license, and complete run/deploy documentation.
- Original generated hero in AVIF (26 KB), WebP (33 KB), and JPEG fallback (65 KB), with prompt, review, date, model, and disclosure recorded in `.factory/design.md` and `assets/src/`.

## Verification

All checks were run against the final production build:

- `npm test`: 2 files, 5 unit tests passed (daily scheduling, record attachment, last-write-wins merge, encrypted round-trip, wrong/short passphrase rejection).
- `npm run build`: passed; output is `dist/` with `dist/index.html` at its root.
- Production bundle: 36.40 KB JavaScript / 11.88 KB gzip; 14.08 KB CSS / 3.93 KB gzip. Both are comfortably inside the 200 KB JS and 50 KB CSS budgets.
- `npm run test:e2e`: 2 Playwright mobile-Chromium tests passed. The suite adds a medication, records an uncertain dose with initials and a note, reloads to prove IndexedDB persistence, checks visible handoff history, performs axe scans, disables the browser network, reloads the full app from the service worker, and confirms the data remains present. It also checks both legal routes.
- `/opt/fleet/lib/verify-url.sh`: passed at 390×844 and desktop; no console errors, title present, `lang="en"`, exactly one `h1`, main landmark present, zero images missing alt, and zero unlabeled buttons.
- Axe: zero serious or critical violations on the empty board, populated handoff, privacy, and terms views.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, total blocking time 0 ms.
- Manual visual review: 390px and 1440px screenshots checked; controls remain at least 44px, the mobile dock respects the safe area, content remains scrollable, and print styling removes app chrome.

## Run and deploy

```sh
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Deploy `dist/` as a static SPA with unknown paths falling back to `index.html`. Serve the root `sw.js` without immutable caching; hashed files in `assets/` can be cached immutably.

## Known gaps and next steps

- The factory still needs to register the production/test paid product and confirm the hosted return URL. No product ID or provider secret is stored in this repository.
- Device sharing is deliberately explicit encrypted file handoff, not real-time cloud sync. Households must exchange a new export to propagate later changes.
- V1 schedules are daily and support three times per medication. Weekday-only, as-needed, tapered, and historical backfill schedules are intentionally out of scope; they should not be simulated with misleading daily entries.
- The five-household, 30-day success-measure pilot remains a post-deployment activity. This build has not been clinically validated and must continue to be described as a coordination record, not medical advice or proof of administration.
