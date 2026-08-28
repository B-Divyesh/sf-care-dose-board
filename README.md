# Dose Witness

Dose Witness keeps a medication record on one device for families caring for an older relative. It records whether each scheduled dose was given, skipped, or uncertain. It also records caregiver initials and notes for the next caregiver.

It keeps a household record. It is not a medical device. It does not provide dosage advice, interaction checks, prescription changes, or pharmacy services.

Live product: <https://care-dose-board.sociobot.in>

Try the isolated sample: <https://care-dose-board.sociobot.in/demo>

## Dose Witness features

- Enter daily medication cards from the household’s current care plan.
- Record a status, caregiver initials, and an optional note.
- See corrections and overdue doses, then print a caregiver summary.
- Store records in this browser without an account, analytics, or cloud storage.
- Encrypt handoff files and keep the latest record when devices are merged.
- Install the app and continue recording after the connection drops.
- Use three active medications for free. A $19 one-time household license removes that limit.
- Use the app by keyboard or screen reader, with reduced motion and browser zoom.
- Read the privacy policy at `/privacy` and terms at `/terms`.

Every product promise is listed in [`.factory/claims.json`](.factory/claims.json) with one browser test.

## Run locally

Use Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. The browser keeps app data under that address.

## Test and build

```sh
npm test
npm run build
npm run verify:release
npm run test:e2e
```

Run one documented claim with its command from `.factory/claims.json`. For example:

```sh
npm run test:claims -- --grep @claim:offline-reload
```

The build writes the static site to `dist/`, including `dist/index.html`. Preview it with `npm run preview`.

The browser tests cover adding a medication and recording a status. They cover keyboard focus, offline reloads, worker updates, and route metadata. They also check legal pages, console errors, and serious or critical accessibility findings.

## Data ownership and device handoff

The browser saves all care plan and dose data on this device. The app does not sync care data in the background.

Download an encrypted handoff file, send the passphrase separately, then import the file on the other device. Import keeps records unique to both devices. It uses the newest timestamp when the same record changed on both.

The app cannot recover an export passphrase. Keep a printed or encrypted backup. Clearing browser site data removes the local board.

## Demo sandbox

`/demo` and `/?demo=1` open realistic sample data in the `demo:dose-witness` session namespace. Demo actions never read or write the real `dose-witness` database. Reset restores the sample. Start for real discards the demo and opens the real board.

See [`.factory/demo.md`](.factory/demo.md) for sample details and verification steps.

## Deployment

Deploy `dist/` as a static site. The host routes known app URLs to `index.html` and unknown URLs to `404.html`. `staticwebapp.config.json` defines the security headers. It prevents stale app files while caching versioned assets.

The build creates a release id from the complete output. `npm run verify:release` recomputes and checks that id.

Checkout and license verification use only the Sociobot billing API. The product slug comes from this repository. No payment-provider credentials or product IDs are embedded.

## Artwork and design sources

The colors, type, artwork source, and image-generation notes are in [`.factory/design.md`](.factory/design.md). The source artwork and its generation prompt are in `assets/src/`.

## License

MIT — see [LICENSE](LICENSE).
