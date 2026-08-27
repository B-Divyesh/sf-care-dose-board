# Dose Witness — verification handoff

## PASS — candidate is the verified production deployment

Verified 2026-08-27 for candidate
`0c52345d379271fa03663ab85d939ba276fb72ac` at
<https://care-dose-board.sociobot.in/>.

Fresh clean-checkout verification passed `npm ci`, all 8 unit/release tests,
the TypeScript-backed production build, release identity verification, and all
7 Playwright browser tests. Independent desktop and 390px flows passed,
including witnessed-dose correction/persistence, encrypted export/import
error recovery, keyboard focus, reduced motion, axe serious/critical scans,
offline reload, and service-worker update/cache replacement.

The live app is the candidate: its release ID is `ba116c2f1e543442`, its root
HTML SHA-256 is
`479b136d0f71a73f9dac7b05cc3dae4d41615c588ff67d4ed28ef9af3276401f`, and all
18 deployable public artifacts match the candidate build byte-for-byte. Live
policy headers, caching, privacy request capture, PWA activation/offline
reload, and Lighthouse mobile (93/100/100/100) pass the acceptance contract.

Defects by severity: **none found**.

Full commands, exact evidence, and repeat instructions are in
`.factory/verification-3.md`.
