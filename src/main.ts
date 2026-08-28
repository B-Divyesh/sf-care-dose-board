import './styles.css';
import { decryptState, encryptState } from './crypto';
import { loadState, mergeStates, normalizeState, saveState, scheduleForDate } from './data';
import { cachedLicenseIsValid, captureLicenseFromUrl, checkoutUrl, removeLicense, saveLicense, verifyLicense } from './license';
import type { DoseLog, DoseStatus, HouseholdState, Medication, ScheduledDose } from './types';

type View = 'today' | 'medications' | 'handoff' | 'settings' | 'privacy' | 'terms' | 'not-found';

declare const __BUILD_ID__: string;

const DEMO_KEY = 'demo:dose-witness';
const APP_ORIGIN = 'https://care-dose-board.sociobot.in';

const rootElement = document.querySelector<HTMLDivElement>('#app');
if (!rootElement) throw new Error('Application root is missing.');
const root: HTMLDivElement = rootElement;

let state: HouseholdState;
let demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
let view: View = readView();
let isOnline = navigator.onLine;
let isUnlocked = cachedLicenseIsValid();

const icons = {
  today: '<span aria-hidden="true">◷</span>',
  medications: '<span aria-hidden="true">▤</span>',
  handoff: '<span aria-hidden="true">⇄</span>',
  settings: '<span aria-hidden="true">⚙</span>',
};

function h(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] ?? character);
}

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function readView(): View {
  const routes: Record<string, View> = {
    '/': 'today', '/demo': 'today', '/medications': 'medications', '/handoff': 'handoff',
    '/settings': 'settings', '/privacy': 'privacy', '/terms': 'terms',
  };
  return routes[location.pathname] ?? 'not-found';
}

function withDemo(path: string): string {
  if (!demoMode) return path;
  if (path === '/') return '/demo';
  const url = new URL(path, location.origin);
  url.searchParams.set('demo', '1');
  return `${url.pathname}${url.search}${url.hash}`;
}

function pathFor(next: View): string {
  if (next === 'today') return demoMode ? '/demo' : '/';
  return withDemo(`/${next}`);
}

function sampleState(): HouseholdState {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const times = ['07:30', '13:00', now.getHours() >= 20 ? '23:55' : '20:30'];
  const stamp = (time: string, minuteOffset = 0) => {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes + minuteOffset).toISOString();
  };
  const medications: Medication[] = [
    { id: 'demo-blood-pressure', name: 'Blood pressure tablet', strength: '5 mg', instructions: 'With breakfast', times: [times[0]], active: true, createdAt: stamp(times[0], -60), updatedAt: stamp(times[0], -60) },
    { id: 'demo-calcium', name: 'Calcium tablet', strength: '500 mg', instructions: 'After lunch', times: [times[1]], active: true, createdAt: stamp(times[0], -60), updatedAt: stamp(times[0], -60) },
    { id: 'demo-evening', name: 'Evening tablet', strength: '10 mg', instructions: 'Use the current care plan', times: [times[2]], active: true, createdAt: stamp(times[0], -60), updatedAt: stamp(times[0], -60) },
  ];
  const givenKey = `${medications[0].id}:${dateKey}:${times[0]}`;
  const uncertainKey = `${medications[1].id}:${dateKey}:${times[1]}`;
  const logs: DoseLog[] = [
    { id: 'demo-log-given', scheduleKey: givenKey, medicationId: medications[0].id, dueAt: stamp(times[0]), status: 'given', witness: 'AK', note: 'Taken with breakfast.', recordedAt: stamp(times[0], 5), updatedAt: stamp(times[0], 5) },
    { id: 'demo-log-uncertain', scheduleKey: uncertainKey, medicationId: medications[1].id, dueAt: stamp(times[1]), status: 'uncertain', witness: 'RJ', note: 'Packet was open; please confirm before the next scheduled dose.', recordedAt: stamp(times[1], 8), updatedAt: stamp(times[1], 8) },
  ];
  return {
    version: 1, householdName: 'Meera’s care circle', patientName: 'Meera', caregiverInitials: 'AK',
    medications, logs, updatedAt: now.toISOString(),
    audit: logs.map((log, index) => ({ id: `demo-event-${index + 1}`, scheduleKey: log.scheduleKey, medicationId: log.medicationId, status: log.status, witness: log.witness, note: log.note, recordedAt: log.recordedAt })),
  };
}

function normalizeDemoState(): HouseholdState {
  try { return normalizeState(JSON.parse(sessionStorage.getItem(DEMO_KEY) ?? '')); }
  catch { return sampleState(); }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function formatStamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function statusLabel(status: DoseStatus): string {
  return status === 'given' ? 'Given' : status === 'skipped' ? 'Skipped' : 'Uncertain';
}

function shell(content: string): string {
  const navViews: Array<Exclude<View, 'privacy' | 'terms' | 'not-found'>> = ['today', 'medications', 'handoff', 'settings'];
  const nav = (placement: string) => `<nav class="${placement}" aria-label="Primary">
    ${navViews.map(item => `<a class="nav-link" href="${pathFor(item)}" data-view="${item}" ${view === item ? 'aria-current="page"' : ''}>${icons[item]} ${item}</a>`).join('')}
  </nav>`;
  return `<header class="app-header">
      <div class="header-inner">
        <a class="brand" href="${pathFor('today')}" data-view="today" aria-label="Dose Witness, today">
          <img src="/icons/icon.svg" alt="" width="42" height="42" />
          <span><span class="brand-name">Dose Witness</span><span class="brand-sub">One dose. One visible record.</span></span>
        </a>
        ${nav('desktop-nav')}
      </div>
    </header>
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved</strong><span>Changes stay in this tab and never touch your real board.</span><div class="demo-actions"><button class="text-button" type="button" data-reset-demo>Reset demo</button><button class="text-button" type="button" data-start-real>Start for real</button></div></aside>` : ''}
    <main id="main-content" tabindex="-1">${!isOnline ? '<div class="notice offline" role="status"><span aria-hidden="true">●</span> Offline — this board still saves on this device.</div>' : ''}${content}</main>
    <footer class="app-footer"><div class="footer-inner">
      <p><strong>Not a medical device.</strong> Dose Witness records household care; it does not give medical advice or replace a clinician’s instructions. <a href="${withDemo('/settings#about-art')}" data-route-link>Read artwork details</a>.</p>
      <nav class="footer-links" aria-label="Legal"><a href="${withDemo('/privacy')}" data-route-link>Privacy</a><a href="${withDemo('/terms')}" data-route-link>Terms</a><span>Built by Param Factory</span><span>Build ${h(__BUILD_ID__)}</span></nav>
    </div></footer>
    ${nav('mobile-nav')}
    <div id="route-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
    <div class="toast-region" aria-live="polite" aria-atomic="true"></div>`;
}

function pageHead(eyebrow: string, title: string, lede: string, action = ''): string {
  return `<div class="page-head"><div class="page-head-copy"><p class="eyebrow">${h(eyebrow)}</p><h1>${h(title)}</h1><p class="lede">${h(lede)}</p></div>${action}</div>`;
}

function renderLanding(): string {
  return `${pageHead('Household medication record', 'Track each dose for an older relative', 'For families sharing care, record whether each scheduled medication was given, skipped, or uncertain.')}
    <section class="first-action" aria-label="Get started"><div class="button-row"><a class="button primary" href="/demo" data-route-link>Try it with sample data</a><button class="button" type="button" data-add-med>Set up my board</button></div><p>See a filled dose board; nothing is saved.</p></section>
    <section class="hero-empty" aria-labelledby="setup-title"><div class="hero-copy"><p class="eyebrow">One visible record</p><h2 id="setup-title">Show the next caregiver what happened</h2><p>Add the medications and times from the current care plan. Record each dose with a status and caregiver initials.</p></div>
      <picture class="hero-picture"><source srcset="/art/dose-watch.avif" type="image/avif"/><source srcset="/art/dose-watch.webp" type="image/webp"/><img class="hero-art" src="/art/dose-watch.jpg" width="960" height="640" alt="Illustration of three caregivers linking their status marks to one dose record" decoding="async" fetchpriority="high" /></picture></section>
    <ul class="promise-row" aria-label="Product facts"><li><strong>Data stays on this device</strong>No account or cloud care record.</li><li><strong>Works offline</strong>Record a dose without a signal.</li><li><strong>Three dose statuses</strong>Given, skipped, or uncertain.</li></ul>
    <section class="landing-section" aria-labelledby="preview-title"><p class="eyebrow">Live preview</p><h2 id="preview-title">See a filled dose board</h2><div class="preview-board"><div class="preview-dose given"><strong>7:30 AM · Blood pressure tablet</strong><span>✓ Given by AK</span></div><div class="preview-dose uncertain"><strong>1:00 PM · Calcium tablet</strong><span>? Uncertain · note for next caregiver</span></div><div class="preview-dose"><strong>8:30 PM · Evening tablet</strong><span>Awaiting a record</span></div></div><a class="text-link" href="/demo" data-route-link>Open this sample board</a></section>
    <section class="landing-section" aria-labelledby="how-title"><p class="eyebrow">How it works</p><h2 id="how-title">Keep one household record</h2><ol class="steps"><li><strong>Add the care plan</strong><span>Copy medication names and times from current instructions.</span></li><li><strong>Record each dose</strong><span>Choose given, skipped, or uncertain and add initials.</span></li><li><strong>Brief the next caregiver</strong><span>Print a summary or send an encrypted handoff file.</span></li></ol></section>
    <section class="landing-section limits-grid" aria-labelledby="limits-title"><div><p class="eyebrow">Safety boundary</p><h2 id="limits-title">Records care. Never gives medical advice.</h2><p>Dose Witness does not check interactions, change prescriptions, recommend dosages, or contact a pharmacy.</p><a class="text-link" href="/terms" data-route-link>Read the terms</a></div><div><p class="eyebrow">Storage</p><h2>Care data stays in this browser</h2><p>The app has no accounts, analytics, ads, or background cloud sync. You control exports.</p><a class="text-link" href="/privacy" data-route-link>Read the privacy policy</a></div></section>
    <section class="landing-section paid-strip" aria-labelledby="price-title"><div><p class="eyebrow">Household license</p><h2 id="price-title">Start free. Remove the medication limit for $19.</h2><p>The free board allows three active medications. A $19 one-time household license allows unlimited active medications.</p></div><a class="button" href="/settings" data-route-link>View license details</a></section>`;
}

function renderToday(): string {
  const today = new Date();
  const schedule = scheduleForDate(state, today);
  const completed = schedule.filter(item => item.log).length;
  const given = schedule.filter(item => item.log?.status === 'given').length;
  const exceptions = schedule.filter(item => item.log && item.log.status !== 'given').length;
  const overdue = schedule.filter(item => !item.log && item.dueAt.getTime() < Date.now()).length;
  if (!demoMode && !state.medications.some(medication => medication.active)) return renderLanding();
  const who = demoMode ? `Sample dose board for ${state.patientName || 'Meera'}` : state.patientName ? `${state.patientName}’s dose board` : 'Today’s dose board';
  const action = `<button class="button primary no-print" type="button" data-add-med>＋ Add medication</button>`;
  let content = pageHead(formatDate(today), who, demoMode ? 'A filled example for a family sharing care. Change any status to see how the board works.' : 'Record whether each scheduled medication was given, skipped, or uncertain.', action);
  content += `<ul class="summary-strip" aria-label="Today’s dose summary">
    <li><span class="summary-number">${schedule.length}</span><span class="summary-label">Scheduled</span></li>
    <li class="given"><span class="summary-number">${given}</span><span class="summary-label">Given</span></li>
    <li class="needs"><span class="summary-number">${overdue}</span><span class="summary-label">Past due, not recorded</span></li>
    <li><span class="summary-number">${exceptions}</span><span class="summary-label">Skipped or uncertain</span></li>
  </ul>`;
  if (!schedule.length) {
    content += '<div class="empty-compact">There are no active dose times today. Add a time to an active medication.</div>';
  } else {
    content += `<ol class="dose-list" aria-label="Scheduled doses">${schedule.map(renderDose).join('')}</ol>`;
  }
  content += `<p class="fine-print">${completed} of ${schedule.length} scheduled doses have a witnessed status today. A blank dose is not proof that it was missed.</p>`;
  return content;
}

function renderDose(dose: ScheduledDose): string {
  const log = dose.log;
  const overdue = !log && dose.dueAt.getTime() < Date.now();
  const detail = [dose.medication.strength, dose.medication.instructions].filter(Boolean).join(' · ');
  const action = log ? `<div class="status-line"><span class="status-mark" aria-hidden="true">${log.status === 'given' ? '✓' : log.status === 'skipped' ? '—' : '?'}</span>${statusLabel(log.status)}</div>
      <p class="witness">Witnessed by ${h(log.witness)} · ${h(formatStamp(log.recordedAt))}</p>
      <button class="change-button" type="button" data-record="${h(dose.scheduleKey)}">Change record</button>`
    : `<button class="button ${overdue ? 'primary' : ''}" type="button" data-record="${h(dose.scheduleKey)}">${overdue ? 'Record now' : 'Record dose'}</button>${overdue ? '<p class="witness">Past scheduled time</p>' : ''}`;
  return `<li class="dose-card ${log ? h(log.status) : ''}"><div class="time">${h(formatTime(dose.dueAt))}</div>
    <div class="dose-detail"><h2>${h(dose.medication.name)}</h2>${detail ? `<p>${h(detail)}</p>` : ''}${log?.note ? `<p><strong>Handoff:</strong> ${h(log.note)}</p>` : ''}</div>
    <div class="dose-action">${action}</div></li>`;
}

function renderMedications(): string {
  const activeCount = state.medications.filter(item => item.active).length;
  const limitReached = activeCount >= 3 && !isUnlocked;
  let content = pageHead('Care plan', 'Medications', 'Copy the name, strength, instructions, and times from the existing care plan.', `<button class="button primary" type="button" data-add-med ${limitReached ? 'aria-describedby="med-limit"' : ''}>＋ Add medication</button>`);
  if (limitReached) content += `<div id="med-limit" class="notice">The free board includes 3 active medications. Your existing records and encrypted exports remain available. <button class="button small" type="button" data-view="settings">See household unlock</button></div>`;
  if (!state.medications.length) content += '<div class="empty-compact">No medications yet. Add the first one using the schedule already provided by the care team.</div>';
  else content += `<ul class="med-list">${state.medications.map(medication => `<li class="med-card ${medication.active ? '' : 'inactive'}"><div><h2>${h(medication.name)}${medication.active ? '' : ' <span class="fine-print">Paused</span>'}</h2><p>${h([medication.strength, medication.instructions].filter(Boolean).join(' · ') || 'No extra instructions recorded')}</p><div class="schedule-chips">${medication.times.map(time => `<span class="chip">${h(formatTime(new Date(2000, 0, 1, ...time.split(':').map(Number) as [number, number])))}</span>`).join('')}</div></div><div class="button-row"><button class="button small" type="button" data-edit-med="${h(medication.id)}">Edit</button></div></li>`).join('')}</ul>`;
  content += '<div class="callout section-gap"><h3>Keep the care plan authoritative</h3><p>Dose Witness never recommends amounts or changes. Update this board only when the person’s established instructions change.</p></div>';
  return content;
}

function renderHandoff(): string {
  const schedule = scheduleForDate(state, new Date());
  const exceptions = schedule.filter(item => item.log?.status === 'skipped' || item.log?.status === 'uncertain');
  const pending = schedule.filter(item => !item.log);
  const recent = [...state.audit].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 30);
  const medicationName = new Map(state.medications.map(item => [item.id, item.name]));
  const owner = state.patientName ? `For ${state.patientName}. ` : '';
  let content = pageHead('Shift change', 'Handoff', `${owner}Printed ${formatStamp(new Date().toISOString())}. Print a clear snapshot or move an encrypted copy to another caregiver’s device.`, '<button class="button primary no-print" type="button" data-print>Print handoff</button>');
  content += `<ul class="summary-strip" aria-label="Handoff summary"><li><span class="summary-number">${schedule.length - pending.length}</span><span class="summary-label">Recorded today</span></li><li class="needs"><span class="summary-number">${pending.length}</span><span class="summary-label">Awaiting a record</span></li><li><span class="summary-number">${exceptions.length}</span><span class="summary-label">Need handoff</span></li><li><span class="summary-number">${state.medications.filter(item => item.active).length}</span><span class="summary-label">Active medications</span></li></ul>`;
  content += `<div class="panel-grid no-print"><section class="panel" aria-labelledby="export-title"><h2 id="export-title">Encrypted export</h2><p class="muted">Download the full board as an AES-256 encrypted file. Send the passphrase separately.</p><form id="export-form"><div class="field"><label for="export-passphrase">Handoff passphrase</label><input id="export-passphrase" name="passphrase" type="password" minlength="8" autocomplete="new-password" required aria-describedby="export-help"/><small id="export-help">At least 8 characters. We cannot recover it.</small></div><button class="button" type="submit">Download encrypted copy</button><p class="error-text" data-form-error aria-live="polite"></p></form></section>
    <section class="panel" aria-labelledby="import-title"><h2 id="import-title">Import a handoff</h2><p class="muted">Newer medication and dose records are merged by timestamp; your other records stay in place.</p><form id="import-form"><div class="field"><label for="import-file">Encrypted handoff file</label><input id="import-file" name="file" type="file" accept=".dosewitness,application/json" required /></div><div class="field"><label for="import-passphrase">Passphrase</label><input id="import-passphrase" name="passphrase" type="password" autocomplete="current-password" required /></div><button class="button" type="submit">Open and merge</button><p class="error-text" data-form-error aria-live="polite"></p></form></section></div>`;
  content += `<section class="panel section-gap" aria-labelledby="activity-title"><div class="panel-head"><div><h2 id="activity-title">Recent witnessed activity</h2><p class="muted">Status changes stay visible, including corrections.</p></div></div>${recent.length ? `<ol class="activity-list">${recent.map(event => `<li class="activity-item"><time class="tabular" datetime="${h(event.recordedAt)}">${h(formatStamp(event.recordedAt))}</time><div class="activity-detail"><strong>${h(medicationName.get(event.medicationId) ?? 'Removed medication')}</strong>${event.note ? `<div class="muted">${h(event.note)}</div>` : ''}</div><div><span class="activity-status ${h(event.status)}">${h(statusLabel(event.status))}</span><div class="fine-print">by ${h(event.witness)}</div></div></li>`).join('')}</ol>` : '<div class="empty-compact">No dose status has been recorded yet.</div>'}</section>`;
  return content;
}

function renderSettings(): string {
  const unlockCopy = isUnlocked ? `<div class="notice success">Household unlock active — unlimited active medications are available on this device.</div><button class="button danger small" type="button" data-remove-license>Remove license from this device</button>` : `<div class="callout paid"><h3>Unlock unlimited medications — $19 once</h3><p>The free board includes three active medications. A one-time household unlock removes that limit; core status recording, accessibility, printing, and encrypted data export are always free. Sociobot/Dodo is the merchant of record.</p><a class="button primary" href="${checkoutUrl}">Buy household unlock</a></div><form id="license-form" class="form-gap"><div class="field"><label for="license-token">Already purchased? Paste your license</label><input id="license-token" name="token" autocomplete="off" required /><small>The license is stored only in this browser and verified with Sociobot.</small></div><button class="button" type="submit">Verify and restore</button><p class="error-text" data-form-error aria-live="polite"></p></form>`;
  return `${pageHead('This device', 'Household & settings', 'Name the board, set default initials, and manage the one-time household unlock.')}
    <div class="panel-grid"><section class="panel" aria-labelledby="household-title"><h2 id="household-title">Board details</h2><form id="settings-form"><div class="field"><label for="household-name">Household name</label><input id="household-name" name="householdName" maxlength="60" value="${h(state.householdName)}" required /></div><div class="field"><label for="patient-name">Person receiving care</label><input id="patient-name" name="patientName" maxlength="60" value="${h(state.patientName)}" /><small>Optional. Use a first name or familiar name if preferred.</small></div><div class="field"><label for="caregiver-initials">Your default initials</label><input id="caregiver-initials" name="caregiverInitials" maxlength="6" value="${h(state.caregiverInitials)}" autocomplete="off" /><small>Added to new dose records; editable each time.</small></div><button class="button primary" type="submit">Save board details</button></form></section><section class="panel" aria-labelledby="unlock-title"><h2 id="unlock-title">Household unlock</h2>${unlockCopy}</section></div>
    <section class="panel section-gap" id="about-art" aria-labelledby="about-title"><h2 id="about-title">Privacy and purpose</h2><p class="muted">Medication names and dose records stay in this browser. There are no accounts, analytics, ads, cloud sync, or third-party scripts. Only license verification contacts Sociobot when you choose the paid license.</p><p class="muted">The first-run night-watch scene is original AI-generated artwork made for Dose Witness with the factory image model on August 27, 2026. It contains no real people or brands.</p><div class="button-row"><a class="button" href="${withDemo('/privacy')}" data-route-link>Read privacy policy</a><a class="button" href="${withDemo('/terms')}" data-route-link>Read terms</a></div></section>`;
}

function renderLegal(kind: 'privacy' | 'terms'): string {
  const isPrivacy = kind === 'privacy';
  const title = isPrivacy ? 'Privacy policy' : 'Terms of use';
  const body = isPrivacy ? `<p><strong>Effective August 28, 2026.</strong></p><h2>What stays on your device</h2><p>Dose Witness stores household names, medication details, schedules, caregiver initials, dose statuses, notes, and activity history in this browser. We do not receive this information. Clearing site data removes it from that device.</p><h2>Encrypted handoffs</h2><p>Exports use AES-256-GCM encryption in your browser. Your passphrase creates the encryption key. The passphrase is never stored or sent to us. Anyone with both the file and passphrase can read the export.</p><h2>Purchases</h2><p>If you use the household license, its token is stored in this browser. It is sent to the Sociobot billing API for verification at most once per day. Sociobot and Dodo, the merchant of record, process checkout information under their own policies. Dose Witness includes no analytics or advertising trackers.</p><h2>Your choices</h2><p>You can print or export your board at any time. Remove local data by clearing this site’s storage in browser settings. For privacy questions, contact privacy@sociobot.in.</p>`
    : `<p><strong>Effective August 28, 2026.</strong></p><h2>Household record, not medical advice</h2><p>Dose Witness keeps a household record. It is not a medical device. It does not verify prescriptions, identify interactions, recommend dosages, or determine whether a medication should be given. Follow the care plan from a qualified clinician. For urgent or uncertain situations, contact an appropriate medical professional or emergency service.</p><h2>Your responsibility</h2><p>Caregivers must check the person, medication label, scheduled time, and current instructions before recording a dose. A status records what a caregiver entered. It is not independent proof that a medication was administered.</p><h2>Purchase and refunds</h2><p>The optional $19 household license is a one-time purchase. It allows unlimited active medications. Sociobot and Dodo are the merchant of record and handle payment and refunds. A refunded or revoked license may stop paid features. Core records, printing, and export stay available.</p><h2>Availability</h2><p>The app is provided “as is” without a guarantee of uninterrupted availability. Keep an encrypted handoff file or printed summary for your household. Do not rely on this app as the only source of medication instructions.</p>`;
  return `${pageHead('Household policy', title, isPrivacy ? 'Your care records belong to your household.' : 'The limits and responsibilities for using this household record.')}<article class="legal-copy">${body}<p><a class="button" href="${pathFor('settings')}" data-view="settings">Back to settings</a></p></article>`;
}

function renderNotFound(): string {
  return `${pageHead('Not found', 'This page does not exist', 'The address may be old or mistyped. Your dose board has not changed.')}<div class="not-found-sign" aria-hidden="true">404</div><p><a class="button primary" href="${pathFor('today')}" data-view="today">Return to today’s board</a></p>`;
}

const metaByView: Record<View, { title: string; description: string }> = {
  today: { title: 'Dose Witness — record household medication doses', description: 'Record given, skipped, or uncertain medication doses for an older relative on one household board.' },
  medications: { title: 'Medications — Dose Witness', description: 'Enter medication names and schedules from the household’s current care plan.' },
  handoff: { title: 'Handoff — Dose Witness', description: 'Print a caregiver summary or move an encrypted handoff file between devices.' },
  settings: { title: 'Settings — Dose Witness', description: 'Manage board details and the optional Dose Witness household license.' },
  privacy: { title: 'Privacy — Dose Witness', description: 'Learn what Dose Witness stores on this device and when it contacts Sociobot.' },
  terms: { title: 'Terms — Dose Witness', description: 'Read the safety boundaries and terms for using Dose Witness.' },
  'not-found': { title: 'Not found — Dose Witness', description: 'This Dose Witness page does not exist.' },
};

function updateMetadata(): void {
  const meta = demoMode && view === 'today' ? { ...metaByView.today, title: 'Demo — Dose Witness', description: 'Try a filled Dose Witness board with isolated sample data.' } : metaByView[view];
  document.title = meta.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', meta.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', meta.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', meta.description);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', meta.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', meta.description);
  const canonicalPath = demoMode && view === 'today' ? '/demo' : location.pathname;
  const canonical = `${APP_ORIGIN}${canonicalPath}`;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonical);
}

function render(options: { focus?: boolean } = {}): void {
  const content = view === 'today' ? renderToday() : view === 'medications' ? renderMedications() : view === 'handoff' ? renderHandoff() : view === 'settings' ? renderSettings() : view === 'privacy' ? renderLegal('privacy') : view === 'terms' ? renderLegal('terms') : renderNotFound();
  root.innerHTML = shell(content);
  updateMetadata();
  bindShell();
  if (!['privacy', 'terms', 'not-found'].includes(view)) bindView();
  const target = location.hash === '#about-art' ? root.querySelector<HTMLElement>('#about-title') : root.querySelector<HTMLElement>('h1');
  if (target && (options.focus || location.hash === '#about-art')) {
    target.tabIndex = -1;
    requestAnimationFrame(() => { target.focus({ preventScroll: location.hash !== '#about-art' }); target.scrollIntoView({ block: 'start' }); });
  }
  const announcer = root.querySelector<HTMLElement>('#route-announcer');
  if (options.focus && announcer) announcer.textContent = document.title;
}

function bindShell(): void {
  root.querySelectorAll<HTMLElement>('[data-view]').forEach(element => element.addEventListener('click', event => {
    event.preventDefault();
    const next = element.dataset.view as View;
    history.pushState({}, '', pathFor(next));
    view = next;
    render({ focus: true });
  }));
  root.querySelectorAll<HTMLAnchorElement>('[data-route-link]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const href = link.getAttribute('href') ?? '/';
    history.pushState({}, '', href);
    demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
    view = readView();
    if (demoMode && !sessionStorage.getItem(DEMO_KEY)) sessionStorage.setItem(DEMO_KEY, JSON.stringify(sampleState()));
    if (demoMode) state = normalizeDemoState();
    render({ focus: true });
  }));
  root.querySelector<HTMLButtonElement>('[data-reset-demo]')?.addEventListener('click', () => {
    state = sampleState();
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(state));
    render({ focus: true });
    toast('Demo restored to its starting sample.');
  });
  root.querySelector<HTMLButtonElement>('[data-start-real]')?.addEventListener('click', () => void startRealBoard());
}

function bindView(): void {
  root.querySelectorAll<HTMLButtonElement>('[data-add-med]').forEach(button => button.addEventListener('click', () => openMedicationDialog()));
  root.querySelectorAll<HTMLButtonElement>('[data-edit-med]').forEach(button => button.addEventListener('click', () => openMedicationDialog(button.dataset.editMed)));
  root.querySelectorAll<HTMLButtonElement>('[data-record]').forEach(button => button.addEventListener('click', () => openDoseDialog(button.dataset.record ?? '')));
  root.querySelector<HTMLButtonElement>('[data-print]')?.addEventListener('click', () => window.print());
  root.querySelector<HTMLFormElement>('#export-form')?.addEventListener('submit', handleExport);
  root.querySelector<HTMLFormElement>('#import-form')?.addEventListener('submit', handleImport);
  root.querySelector<HTMLFormElement>('#settings-form')?.addEventListener('submit', handleSettings);
  root.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', handleLicense);
  root.querySelector<HTMLButtonElement>('[data-remove-license]')?.addEventListener('click', () => {
    removeLicense(); isUnlocked = false; render(); toast('License removed from this device.');
  });
}

function openMedicationDialog(id?: string): void {
  const medication = id ? state.medications.find(item => item.id === id) : undefined;
  if (!medication && state.medications.filter(item => item.active).length >= 3 && !isUnlocked) {
    view = 'settings'; history.pushState({}, '', pathFor('settings')); render({ focus: true }); toast('The free board already has three active medications.'); return;
  }
  const times = medication?.times ?? ['08:00'];
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'medication-dialog-title');
  dialog.innerHTML = `<form method="dialog" class="dialog-inner" id="medication-form"><div class="dialog-head"><div><p class="eyebrow">Care plan</p><h2 id="medication-dialog-title">${medication ? 'Edit medication' : 'Add medication'}</h2></div><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></div>
    <div class="field"><label for="med-name">Medication name <span aria-hidden="true">*</span></label><input id="med-name" name="name" maxlength="80" value="${h(medication?.name ?? '')}" required /></div>
    <div class="field"><label for="med-strength">Strength as written</label><input id="med-strength" name="strength" maxlength="50" value="${h(medication?.strength ?? '')}" placeholder="For example, 10 mg" /></div>
    <div class="field"><label for="med-instructions">Existing instructions</label><textarea id="med-instructions" name="instructions" maxlength="240" placeholder="Copy the care plan; do not add new medical advice">${h(medication?.instructions ?? '')}</textarea></div>
    <fieldset class="field"><legend>Daily dose times <span aria-hidden="true">*</span></legend><div class="time-fields">${[0,1,2].map(index => `<label>Time ${index + 1}${index ? ' (optional)' : ''}<input name="time${index}" type="time" value="${h(times[index] ?? '')}" ${index === 0 ? 'required' : ''}/></label>`).join('')}</div><small>Use the times in the current care plan. Up to three each day.</small></fieldset>
    ${medication ? `<div class="field"><label><input class="inline-checkbox" name="active" type="checkbox" ${medication.active ? 'checked' : ''}/> Active on today’s board</label></div>` : ''}
    <div class="button-row"><button class="button primary" type="submit" value="save">${medication ? 'Save medication' : 'Add to board'}</button><button class="button ghost" type="button" data-close>Cancel</button>${medication ? '<button class="button danger" type="button" data-delete-med>Delete</button>' : ''}</div><p class="error-text" data-form-error aria-live="polite"></p></form>`;
  document.body.append(dialog);
  const close = () => dialog.close();
  dialog.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', close));
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector<HTMLFormElement>('#medication-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const active = medication ? data.get('active') === 'on' : true;
    if (active && !medication?.active && state.medications.filter(item => item.active).length >= 3 && !isUnlocked) {
      setFormError(form, 'The free board supports three active medications. Unlock the household board or pause another medication.'); return;
    }
    const timeValues = [data.get('time0'), data.get('time1'), data.get('time2')].filter((item): item is string => typeof item === 'string' && item.length > 0);
    const now = new Date().toISOString();
    const next: Medication = { id: medication?.id ?? uid('med'), name: String(data.get('name')).trim(), strength: String(data.get('strength')).trim(), instructions: String(data.get('instructions')).trim(), times: [...new Set(timeValues)].sort(), active, createdAt: medication?.createdAt ?? now, updatedAt: now };
    if (!next.name || !next.times.length) { setFormError(form, 'Add a medication name and at least one dose time.'); return; }
    state.medications = medication ? state.medications.map(item => item.id === next.id ? next : item) : [...state.medications, next];
    await persist('Medication saved.'); dialog.close(); render();
  });
  dialog.querySelector<HTMLButtonElement>('[data-delete-med]')?.addEventListener('click', async () => {
    if (!medication || !confirm(`Delete ${medication.name}? Existing witnessed activity will stay in handoff history.`)) return;
    state.medications = state.medications.filter(item => item.id !== medication.id);
    state.updatedAt = new Date().toISOString();
    await persist('Medication deleted.'); dialog.close(); render();
  });
  dialog.showModal();
}

function openDoseDialog(scheduleKey: string): void {
  const dose = scheduleForDate(state, new Date()).find(item => item.scheduleKey === scheduleKey);
  if (!dose) { toast('That scheduled dose is no longer on today’s board.'); return; }
  const current = dose.log;
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'dose-dialog-title');
  dialog.innerHTML = `<form method="dialog" class="dialog-inner" id="dose-form"><div class="dialog-head"><div><p class="eyebrow">${h(formatTime(dose.dueAt))} dose</p><h2 id="dose-dialog-title">Witness ${h(dose.medication.name)}</h2></div><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></div>
    <fieldset class="status-options"><legend>What happened? <span aria-hidden="true">*</span></legend>${(['given','skipped','uncertain'] as DoseStatus[]).map(status => `<div class="status-option ${status}"><input id="status-${status}" name="status" type="radio" value="${status}" ${current?.status === status || (!current && status === 'given') ? 'checked' : ''}/><label for="status-${status}"><span class="status-mark" aria-hidden="true">${status === 'given' ? '✓' : status === 'skipped' ? '—' : '?'}</span>${statusLabel(status)}</label></div>`).join('')}</fieldset>
    <div class="field"><label for="witness">Caregiver initials <span aria-hidden="true">*</span></label><input id="witness" name="witness" maxlength="6" value="${h(current?.witness ?? state.caregiverInitials)}" autocomplete="off" required /></div>
    <div class="field"><label for="dose-note">Handoff note</label><textarea id="dose-note" name="note" maxlength="240" placeholder="Optional: what should the next caregiver know?">${h(current?.note ?? '')}</textarea><small>For uncertainty or a skipped dose, add useful facts—not medical advice.</small></div>
    <div class="button-row"><button class="button primary" type="submit">${current ? 'Update record' : 'Record dose'}</button><button class="button ghost" type="button" data-close>Cancel</button></div><p class="error-text" data-form-error aria-live="polite"></p></form>`;
  document.body.append(dialog);
  dialog.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector<HTMLFormElement>('#dose-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const witness = String(data.get('witness')).trim().toUpperCase();
    const status = data.get('status') as DoseStatus;
    if (!witness || !['given','skipped','uncertain'].includes(status)) { setFormError(form, 'Choose a status and add the caregiver’s initials.'); return; }
    const now = new Date().toISOString();
    const log: DoseLog = { id: current?.id ?? uid('dose'), scheduleKey, medicationId: dose.medication.id, dueAt: dose.dueAt.toISOString(), status, witness, note: String(data.get('note')).trim(), recordedAt: now, updatedAt: now };
    state.logs = current ? state.logs.map(item => item.id === current.id ? log : item) : [...state.logs, log];
    state.audit.push({ id: uid('event'), scheduleKey, medicationId: dose.medication.id, status, witness, note: log.note, recordedAt: now });
    state.caregiverInitials = witness;
    await persist(`${dose.medication.name} marked ${statusLabel(status).toLowerCase()} by ${witness}.`);
    dialog.close(); render();
  });
  dialog.showModal();
}

async function handleExport(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  try {
    if (button) { button.disabled = true; button.textContent = 'Encrypting…'; }
    const payload = await encryptState(state, String(data.get('passphrase')));
    const blobUrl = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = blobUrl; link.download = `dose-witness-${new Date().toISOString().slice(0,10)}.dosewitness`; link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000); form.reset(); toast('Encrypted handoff downloaded.');
  } catch (error) { setFormError(form, error instanceof Error ? error.message : 'Could not create the handoff.'); }
  finally { if (button) { button.disabled = false; button.textContent = 'Download encrypted copy'; } }
}

async function handleImport(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const file = data.get('file');
  if (!(file instanceof File)) { setFormError(form, 'Choose a Dose Witness handoff file.'); return; }
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  try {
    if (button) { button.disabled = true; button.textContent = 'Opening…'; }
    const incoming = await decryptState(await file.text(), String(data.get('passphrase')));
    state = mergeStates(state, incoming);
    await saveCurrentState(); form.reset(); render(); toast('Encrypted handoff merged into this board.');
  } catch (error) { setFormError(form, error instanceof Error ? error.message : 'Could not import this handoff.'); }
  finally { if (button?.isConnected) { button.disabled = false; button.textContent = 'Open and merge'; } }
}

async function handleSettings(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  state.householdName = String(data.get('householdName')).trim();
  state.patientName = String(data.get('patientName')).trim();
  state.caregiverInitials = String(data.get('caregiverInitials')).trim().toUpperCase();
  await persist('Board details saved.'); render();
}

async function handleLicense(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const token = String(new FormData(form).get('token')).trim();
  if (!token) { setFormError(form, 'Paste the license token from your receipt.'); return; }
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  try {
    saveLicense(token); if (button) { button.disabled = true; button.textContent = 'Verifying…'; }
    const result = await verifyLicense(true);
    if (!result.valid) { removeLicense(); throw new Error(`That license is not active${result.reason ? ` (${result.reason.replace('_', ' ')})` : ''}.`); }
    isUnlocked = true; render(); toast('Household unlock restored.');
  } catch (error) { setFormError(form, error instanceof Error ? error.message : 'Could not verify the license. Check your connection.'); }
  finally { if (button?.isConnected) { button.disabled = false; button.textContent = 'Verify and restore'; } }
}

function setFormError(form: HTMLFormElement, message: string): void {
  const error = form.querySelector<HTMLElement>('[data-form-error]');
  if (error) { error.textContent = message; error.focus(); }
}

async function persist(message: string): Promise<void> {
  state.updatedAt = new Date().toISOString();
  try { await saveCurrentState(); toast(message); }
  catch { toast('This change could not be saved. Check private browsing or device storage.'); }
}

async function saveCurrentState(): Promise<void> {
  if (demoMode) sessionStorage.setItem(DEMO_KEY, JSON.stringify(state));
  else await saveState(state);
}

async function startRealBoard(): Promise<void> {
  sessionStorage.removeItem(DEMO_KEY);
  demoMode = false;
  history.pushState({}, '', '/');
  view = 'today';
  state = await loadState();
  render({ focus: true });
}

function toast(message: string, action?: { label: string; run: () => void }): void {
  const region = document.querySelector<HTMLElement>('.toast-region');
  if (!region) return;
  const item = document.createElement('div'); item.className = 'toast'; item.setAttribute('role', 'status');
  const text = document.createElement('span'); text.textContent = message; item.append(text);
  if (action) { const button = document.createElement('button'); button.className = 'button small'; button.textContent = action.label; button.addEventListener('click', action.run); item.append(' ', button); }
  region.append(item); setTimeout(() => item.remove(), action ? 12_000 : 4_500);
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  const register = () => navigator.serviceWorker.register('/sw.js').then(registration => {
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          toast('A refreshed Dose Witness is ready.', { label: 'Reload', run: () => location.reload() });
        }
      });
    });
  }).catch(() => toast('Offline setup could not finish. The board still works while this page is open.'));
  if (document.readyState === 'complete') void register();
  else addEventListener('load', () => void register(), { once: true });
}

async function start(): Promise<void> {
  captureLicenseFromUrl();
  isUnlocked = cachedLicenseIsValid();
  try {
    if (demoMode) {
      if (!sessionStorage.getItem(DEMO_KEY)) sessionStorage.setItem(DEMO_KEY, JSON.stringify(sampleState()));
      state = normalizeDemoState();
    } else state = await loadState();
  }
  catch {
    state = { version: 1, householdName: 'Our care circle', patientName: '', caregiverInitials: '', medications: [], logs: [], audit: [], updatedAt: new Date().toISOString() };
    root.innerHTML = shell(`${pageHead('Storage unavailable', 'This board could not open', 'Your browser blocked private device storage. Allow site storage or leave private browsing, then reload.')}<button class="button primary" type="button" data-reload>Try again</button>`);
    root.querySelector<HTMLButtonElement>('[data-reload]')?.addEventListener('click', () => location.reload());
    return;
  }
  render(); registerServiceWorker();
  if (localStorage.getItem('sb_license:care-dose-board')) verifyLicense().then(result => { if (!result.skipped) { isUnlocked = result.valid; render(); if (!result.valid) toast('The saved license is no longer active.'); } }).catch(() => undefined);
}

addEventListener('popstate', () => {
  demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
  view = readView();
  if (demoMode) state = normalizeDemoState();
  else void loadState().then(realState => { state = realState; render({ focus: true }); });
  if (demoMode) render({ focus: true });
});
addEventListener('online', () => { isOnline = true; render(); toast('Back online. Your local board stayed available.'); });
addEventListener('offline', () => { isOnline = false; render(); });

document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector<HTMLElement>('#main-content');
  if (!main) return;
  main.focus({ preventScroll: true });
  main.scrollIntoView({ block: 'start' });
});

void start();
