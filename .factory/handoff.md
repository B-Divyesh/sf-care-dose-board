# Dose Witness — verification handoff

## FAIL — candidate is not the production deployment

Verified 2026-08-27 for candidate
`97e8cb495124b06d88c8bb8125a9c4306a8fbf7a` at
<https://care-dose-board.sociobot.in/>.

The candidate passes clean local install, unit tests (5/5), TypeScript-backed
production build, browser tests (5/5), manual core/edge/recovery flows,
offline reload, axe serious/critical scans, privacy request capture, and
desktop/390px checks. Its build is within the JS/CSS/image budgets.

However, the live URL serves a different later release: candidate worker cache
`dose-witness-shell-1e83ddcb22927db9` versus live
`dose-witness-shell-ba116c2f1e543442`, with different hashed JS/CSS and
manifest start URL. This is a High release-blocking deployment identity defect.
The live site itself passed fresh browser, policy, and header smoke checks, but
those observations do not validate this candidate.

See `.factory/verification-2.md` for commands, exact evidence, test scope,
and the required remediation: deploy the candidate's exact `dist/` and rerun
the live identity/offline/header verification.
