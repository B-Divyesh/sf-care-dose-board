import { EMPTY_STATE, type AuditEvent, type DoseLog, type HouseholdState, type Medication, type ScheduledDose } from './types';

const DB_NAME = 'dose-witness';
const DB_VERSION = 1;
const STORE = 'household';
const STATE_KEY = 'primary';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open private storage.'));
  });
}

export async function loadState(): Promise<HouseholdState> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(STATE_KEY);
    request.onsuccess = () => resolve(normalizeState(request.result));
    request.onerror = () => reject(request.error ?? new Error('Could not read the dose board.'));
    transaction.oncomplete = () => db.close();
  });
}

export async function saveState(state: HouseholdState): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(state, STATE_KEY);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('Could not save the dose board.')); };
  });
}

export function normalizeState(value: unknown): HouseholdState {
  if (!value || typeof value !== 'object') return structuredClone(EMPTY_STATE);
  const candidate = value as Partial<HouseholdState>;
  const text = (input: unknown, max = 240): string => typeof input === 'string' ? input.slice(0, max) : '';
  const stamp = (input: unknown): string => typeof input === 'string' && !Number.isNaN(Date.parse(input)) ? input : new Date(0).toISOString();
  const medications = Array.isArray(candidate.medications) ? candidate.medications.flatMap(raw => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Partial<Medication>;
    const times = Array.isArray(item.times) ? [...new Set(item.times.filter((time): time is string => typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)))].slice(0, 3).sort() : [];
    if (!text(item.id, 100) || !text(item.name, 80) || !times.length) return [];
    return [{ id: text(item.id, 100), name: text(item.name, 80), strength: text(item.strength, 50), instructions: text(item.instructions), times, active: item.active !== false, createdAt: stamp(item.createdAt), updatedAt: stamp(item.updatedAt) }];
  }) : [];
  const statuses = new Set(['given', 'skipped', 'uncertain']);
  const logs = Array.isArray(candidate.logs) ? candidate.logs.flatMap(raw => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Partial<DoseLog>;
    if (!text(item.id, 100) || !text(item.scheduleKey, 180) || !text(item.medicationId, 100) || !statuses.has(String(item.status))) return [];
    return [{ id: text(item.id, 100), scheduleKey: text(item.scheduleKey, 180), medicationId: text(item.medicationId, 100), dueAt: stamp(item.dueAt), status: item.status as DoseLog['status'], witness: text(item.witness, 6), note: text(item.note), recordedAt: stamp(item.recordedAt), updatedAt: stamp(item.updatedAt) }];
  }) : [];
  const audit = Array.isArray(candidate.audit) ? candidate.audit.flatMap(raw => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Partial<AuditEvent>;
    if (!text(item.id, 100) || !text(item.scheduleKey, 180) || !text(item.medicationId, 100) || !statuses.has(String(item.status))) return [];
    return [{ id: text(item.id, 100), scheduleKey: text(item.scheduleKey, 180), medicationId: text(item.medicationId, 100), status: item.status as AuditEvent['status'], witness: text(item.witness, 6), note: text(item.note), recordedAt: stamp(item.recordedAt) }];
  }) : [];
  return {
    ...structuredClone(EMPTY_STATE),
    ...candidate,
    version: 1,
    householdName: typeof candidate.householdName === 'string' ? candidate.householdName : EMPTY_STATE.householdName,
    patientName: typeof candidate.patientName === 'string' ? candidate.patientName : '',
    caregiverInitials: typeof candidate.caregiverInitials === 'string' ? candidate.caregiverInitials : '',
    medications,
    logs,
    audit,
    updatedAt: stamp(candidate.updatedAt),
  };
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function scheduleForDate(state: HouseholdState, date: Date): ScheduledDose[] {
  const key = localDateKey(date);
  const logs = new Map(state.logs.map(log => [log.scheduleKey, log]));
  return state.medications
    .filter(medication => medication.active)
    .flatMap(medication => medication.times.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const dueAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
      const scheduleKey = `${medication.id}:${key}:${time}`;
      return { scheduleKey, medication, dueAt, log: logs.get(scheduleKey) };
    }))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime() || a.medication.name.localeCompare(b.medication.name));
}

export function mergeStates(current: HouseholdState, incoming: HouseholdState): HouseholdState {
  const newer = new Date(incoming.updatedAt).getTime() > new Date(current.updatedAt).getTime() ? incoming : current;
  const mergeBy = <T extends { id: string; updatedAt?: string; recordedAt?: string }>(a: T[], b: T[]): T[] => {
    const values = new Map<string, T>();
    for (const item of [...a, ...b]) {
      const existing = values.get(item.id);
      const stamp = item.updatedAt ?? item.recordedAt ?? '';
      const existingStamp = existing?.updatedAt ?? existing?.recordedAt ?? '';
      if (!existing || stamp >= existingStamp) values.set(item.id, item);
    }
    return [...values.values()];
  };
  return {
    ...newer,
    medications: mergeBy<Medication>(current.medications, incoming.medications),
    logs: mergeBy<DoseLog>(current.logs, incoming.logs),
    audit: mergeBy<AuditEvent>(current.audit, incoming.audit).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    updatedAt: new Date().toISOString(),
  };
}
