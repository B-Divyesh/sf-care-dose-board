# Dose Witness

Dose Witness is a private, local-first medication handoff board for families caring for an older relative. It records whether each scheduled dose was **given**, **skipped**, or **uncertain**, who witnessed that status, and what the next caregiver needs to know.

It is a coordination utility, not a medical device. It does not provide dosage advice, interaction checking, prescription changes, or pharmacy services.

Live product: <https://care-dose-board.sociobot.in>

## What it includes

- Daily medication cards generated from an existing household care plan
- Explicit status recording with caregiver initials and optional handoff notes
- Visible correction history, past-due context, and a printable shift handoff
- IndexedDB persistence with no account, analytics, or cloud storage
- AES-256-GCM encrypted export/import with timestamp-based merging between devices
- Installable PWA shell that reloads and continues recording offline
- A useful free board for three active medications; a $19 one-time household license unlocks unlimited active medications
- Keyboard, screen-reader, reduced-motion, 390px mobile, and print treatments
- Plain-language `/privacy` and `/terms` pages

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Browser data is stored only for that origin.

## Test and build

```sh
npm test
npm run build
```

The production command is exactly `npm run build`. It writes the static deployment to `dist/`, with `dist/index.html` at its root.

The browser suite covers a complete mobile medication/status/handoff path, an offline reload with preserved IndexedDB data, legal routes, console errors, and serious/critical axe findings:

```sh
npx playwright install chromium   # first run only
npm run test:e2e
```

Preview the built app with:

```sh
npm run preview
```

## Data ownership and device handoff

All care-plan and dose data is saved in IndexedDB. There is intentionally no background cloud synchronization. Use **Handoff → Download encrypted copy**, share that file, communicate the passphrase separately, and import it on another device. Import keeps records unique to both devices and uses the newest timestamp when the same record was changed on both.

The app cannot recover an export passphrase. Keep an appropriate printed or encrypted backup; clearing browser site data removes the local board.

## Deployment

Deploy the contents of `dist/` as a static site with SPA fallback to `index.html`. Serve `sw.js` from the site root over HTTPS without an immutable cache header so updates can be detected. Hashed files under `assets/` may be cached immutably.

Checkout and license verification use only the Sociobot billing API. The product slug is derived from this repository and no payment-provider credentials or product IDs are embedded.

## Design and provenance

The product-specific night-market visual system and generated-asset provenance are documented in [.factory/design.md](.factory/design.md). The original source artwork and prompt sidecar live in `assets/src/`.

## License

MIT — see [LICENSE](LICENSE).
