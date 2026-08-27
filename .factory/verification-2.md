# Dose Witness — independent candidate verification 2

**Result: FAIL**

Verified 2026-08-27 from a clean detached worktree at candidate
`97e8cb495124b06d88c8bb8125a9c4306a8fbf7a`, against the required production
URL <https://care-dose-board.sociobot.in/>. Product source was not modified.

## Release-blocking defect

### High — production does not match the candidate

The required live URL is healthy, but it is not candidate `97e8cb4` and
therefore cannot be accepted as that candidate's deployment.

Fresh production build of the candidate generated:

| Item | Candidate | Live URL |
| --- | --- | --- |
| JavaScript | `assets/index-Dscl1SQp.js` | `assets/index-B_lIVptd.js` |
| CSS | `assets/index-CEz_mkzP.css` | `assets/index-BYB0Sb6Q.css` |
| Worker cache | `dose-witness-shell-1e83ddcb22927db9` | `dose-witness-shell-ba116c2f1e543442` |
| Manifest `start_url` | `/?source=pwa-1e83ddcb22927db9` | `/?source=pwa-ba116c2f1e543442` |

The candidate and live `index.html`, `sw.js`, and manifest also have different
SHA-256 digests. This is fresh evidence of a later deployment, not a
deployment-only failure of the candidate. Deploy the candidate's exact `dist/`
and rerun the live identity comparison before claiming a candidate PASS.

## Clean-checkout gates

Worktree: `/tmp/care-dose-board-qa-97e8cb4`, detached at the exact SHA above.

- `npm ci`: passed; 59 packages audited, 0 vulnerabilities.
- `npm test`: passed — 2 files, 5 tests.
- `npm run build`: passed (`tsc --noEmit && vite build`), producing `dist/`.
  There is no separate lint or release-verification script at this candidate;
  the TypeScript check is part of the exact build.
- `npx playwright install chromium && npm run test:e2e`: passed — 5/5 mobile
  Chromium tests. The initial clean run could not launch because the browser
  binary was absent; after installing the declared Playwright browser, the
  rerun passed.
- Initial application JS was 36.83 kB (11.98 kB gzip) and CSS 14.08 kB
  (3.93 kB gzip), below the 200 kB / 50 kB static-PWA budgets. Hero AVIF,
  WebP, and JPEG were 26 kB, 33 kB, and 65 kB respectively.

## Independent local product exercise

On the candidate's local production preview, at 1440x900 and 390x844:

- Added a medication at the `00:00` boundary; recorded an **uncertain** dose
  with lowercase initials and a handoff note; refreshed and confirmed the
  witnessed record persisted in IndexedDB.
- Used a medication name containing `<img src=x onerror=alert(1)>`; it was
  rendered as literal text and produced no execution or console error.
- Confirmed empty caregiver initials are invalid; confirmed the export
  passphrase minimum rejects a short value.
- Downloaded an encrypted handoff: JSON reported
  `dose-witness-encrypted`, `PBKDF2-SHA-256`, and 250,000 iterations; it did
  not contain the medication plaintext. A wrong passphrase showed the
  recoverable “Could not open this handoff” error, and the correct passphrase
  merged successfully.
- Confirmed 390px mobile bottom navigation, no horizontal overflow, a
  viewport-fitting dialog, Escape close, and reduced motion (`0.01ms`
  transition duration). Desktop and mobile had no console or page errors.
- Axe found zero serious/critical violations in the manually exercised
  desktop handoff and 390px empty states. The browser suite also covers the
  legal pages and the full witnessed/offline path.
- The browser suite waited for an active service worker, switched the context
  offline, reloaded, and retained the handoff data. It also verifies cache
  namespace generation and deletion of an older Dose Witness cache.

## Privacy, browser policy, and live observations

- First-load request capture for the local candidate saw only same-origin
  requests. No analytics, third-party scripts, fonts, or outbound care-data
  requests were observed. Source and behavior use IndexedDB local storage;
  Sociobot is only relevant to the optional license route.
- Candidate `dist/staticwebapp.config.json` specifies an immutable one-year
  `/assets/*` policy, revalidation/no-store for manifest/worker, CSP,
  Permissions-Policy, `nosniff`, referrer policy, and a webmanifest MIME type.
  A local Vite preview does not apply those deployment headers.
- The **live later release** returned HTTPS 200, HSTS, CSP, Permissions-Policy,
  nosniff, strict referrer policy, `application/manifest+json`, immutable
  caching for its hashed JS/CSS, and no-store for `sw.js`. Fresh desktop and
  390px browser checks on that different release found one h1, working visible
  skip focus, an active worker, no overflow, no console/page errors, no
  off-origin requests, and zero axe serious/critical findings. These are not
  evidence that candidate `97e8cb4` is deployed.
- A fresh Lighthouse CLI attempt could not produce a report in this container
  because its runner was incompatible with the installed Node runtime. Bundle
  budgets and the Lighthouse-class semantic, contrast/axe, response, mobile,
  and runtime checks above were completed directly.

## Required next step

Deploy the exact candidate `dist/` to the target URL, then verify that the
three identity-bearing artifacts (HTML asset names, worker cache namespace,
and manifest `start_url`) match `1e83ddcb22927db9`; rerun live offline and
header checks after that deployment.
