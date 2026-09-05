# Dose Witness copy audit

Audited 2026-09-05. Counts use whitespace-delimited words. Hyphenated terms count as one word. Interface labels are included because visitors and screen readers encounter them as copy.

## Landing page

| Words | Copy | Result |
| ---: | --- | --- |
| 4 | Skip to dose board | Pass |
| 2 | Dose Witness | Pass |
| 2 | One dose. | Pass |
| 3 | One visible record. | Pass; `single-visible-record` claim |
| 1 | Today | Pass |
| 1 | Medications | Pass |
| 1 | Handoff | Pass |
| 1 | Settings | Pass |
| 3 | Household medication record | Pass |
| 7 | Track each dose for an older relative | Pass |
| 14 | For families sharing care, record whether each scheduled medication was given, skipped, or uncertain. | Pass |
| 5 | Try it with sample data | Pass |
| 4 | Set up my board | Pass |
| 8 | See a filled dose board; nothing is saved. | Pass |
| 5 | Data stays on this device | Pass; `device-only` claim |
| 6 | No account or cloud care record. | Pass; `device-only` claim |
| 2 | Works offline | Pass; `offline-reload` claim |
| 6 | Record a dose without a signal. | Pass; `offline-reload` claim |
| 3 | Three dose statuses | Pass; `status-recording` claim |
| 4 | Given, skipped, or uncertain. | Pass; `status-recording` claim |
| 3 | One visible record | Pass; `single-visible-record` claim |
| 6 | Show the next caregiver what happened | Pass |
| 10 | Add the medications and times from the current care plan. | Pass |
| 10 | Record each dose with a status and caregiver initials. | Pass; `status-recording` claim |
| 10 | Illustration of three caregivers linking their status marks to one dose record. | Pass |
| 2 | Live preview | Pass |
| 5 | See a filled dose board | Pass |
| 6 | 7:30 AM · Blood pressure tablet | Pass |
| 4 | Given by AK | Pass |
| 5 | 1:00 PM · Calcium tablet | Pass |
| 7 | Uncertain · note for next caregiver | Pass |
| 5 | 8:30 PM · Evening tablet | Pass |
| 3 | Awaiting a record | Pass |
| 4 | Open this sample board | Pass |
| 3 | How it works | Pass |
| 4 | Keep one household record | Pass |
| 4 | Add the care plan | Pass |
| 8 | Copy medication names and times from current instructions. | Pass |
| 3 | Record each dose | Pass |
| 9 | Choose given, skipped, or uncertain and add initials. | Pass |
| 4 | Brief the next caregiver | Pass |
| 9 | Print a summary or send an encrypted handoff file. | Pass |
| 2 | Safety boundary | Pass |
| 6 | Records care. Never gives medical advice. | Pass; `product-boundaries` claim |
| 12 | Dose Witness does not check interactions, change prescriptions, recommend dosages, or contact a pharmacy. | Pass; `product-boundaries` claim |
| 3 | Read the terms | Pass |
| 1 | Storage | Pass |
| 6 | Care data stays in this browser | Pass; `device-only` claim |
| 13 | The app has no accounts, analytics, ads, or background cloud sync. | Pass; `device-only` claim |
| 3 | You control exports. | Pass; `encrypted-handoff` claim |
| 5 | Read the privacy policy | Pass |
| 5 | Not a medical device. | Pass; `product-boundaries` claim |
| 14 | Dose Witness records household care; it does not give medical advice or replace a clinician’s instructions. | Pass; `product-boundaries` claim |
| 3 | Read artwork details | Pass |
| 1 | Privacy | Pass |
| 1 | Terms | Pass |
| 4 | Built by Param Factory | Pass |
| 3 | Build v1.1.0 | Pass |

No sentence exceeds 22 words. No sentence uses a banned marketing word. The first screen states the job, audience, sample action, result, and three concrete facts.

## README check

The review’s flagged README sentences were rewritten or removed. No sentence exceeds 22 words. The README now says “app updates” and “page titles and links,” “Try the sample safely,” and plain deployment results. It has no paid-checkout paragraph because the required external catalog entry is not enabled.

## Terminology

| Concept | One term used |
| --- | --- |
| Medicine item | medication |
| Existing instructions | care plan |
| Transfer file | encrypted handoff file |
| Person entering a status | caregiver |
| Result of a scheduled dose | status |
| Shared screen and record | board |
