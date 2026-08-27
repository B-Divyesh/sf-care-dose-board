export type DoseStatus = 'given' | 'skipped' | 'uncertain';

export interface Medication {
  id: string;
  name: string;
  strength: string;
  instructions: string;
  times: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoseLog {
  id: string;
  scheduleKey: string;
  medicationId: string;
  dueAt: string;
  status: DoseStatus;
  witness: string;
  note: string;
  recordedAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  scheduleKey: string;
  medicationId: string;
  status: DoseStatus;
  witness: string;
  note: string;
  recordedAt: string;
}

export interface HouseholdState {
  version: 1;
  householdName: string;
  patientName: string;
  caregiverInitials: string;
  medications: Medication[];
  logs: DoseLog[];
  audit: AuditEvent[];
  updatedAt: string;
}

export interface ScheduledDose {
  scheduleKey: string;
  medication: Medication;
  dueAt: Date;
  log?: DoseLog;
}

export const EMPTY_STATE: HouseholdState = {
  version: 1,
  householdName: 'Our care circle',
  patientName: '',
  caregiverInitials: '',
  medications: [],
  logs: [],
  audit: [],
  updatedAt: new Date(0).toISOString(),
};
