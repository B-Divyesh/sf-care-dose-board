# Dose Witness demo sandbox

## Open the demo

- Published URL: <https://care-dose-board.sociobot.in/demo>
- Alternate direct entry: <https://care-dose-board.sociobot.in/?demo=1>
- Local URL: `http://127.0.0.1:4173/demo`

The first screen is already a working dose board for Meera. It includes a morning blood pressure tablet marked given by AK, a calcium tablet marked uncertain by RJ with a note, and an evening tablet awaiting a record.

## Isolation and reset

The demo reads and writes only the `demo:dose-witness` key in `sessionStorage`. It never opens the real `dose-witness` IndexedDB database. Demo changes last only for the browser tab.

Use **Reset demo** to restore the original sample. Use **Start for real** to delete the demo key and open the real board. Demo data is never copied into the real board.

## Verification

Run all demo-backed claim tests:

```sh
npm run build
npm run test:claims
```

The suite proves reset, exit, real-data isolation, offline reload, same-origin network behavior, encryption, merge rules, printing, limits, routing, and accessibility.
