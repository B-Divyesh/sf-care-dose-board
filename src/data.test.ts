import { describe, expect, it } from 'vitest';
import { localDateKey, mergeStates, scheduleForDate } from './data';
import type { HouseholdState } from './types';

function board(): HouseholdState {
  return {
    version: 1,
    householdName: 'Test household',
    patientName: 'Mae',
    caregiverInitials: 'JR',
    updatedAt: '2026-08-27T08:00:00.000Z',
    medications: [{
      id: 'med-1', name: 'Morning tablet', strength: '10 mg', instructions: 'With breakfast',
      times: ['20:00', '08:00'], active: true, createdAt: '2026-08-20T00:00:00.000Z', updatedAt: '2026-08-20T00:00:00.000Z',
    }],
    logs: [],
    audit: [],
  };
}

describe('dose scheduling', () => {
  it('uses local calendar dates and sorts daily doses', () => {
    const date = new Date(2026, 7, 27, 12, 0);
    expect(localDateKey(date)).toBe('2026-08-27');
    const schedule = scheduleForDate(board(), date);
    expect(schedule.map(item => item.dueAt.getHours())).toEqual([8, 20]);
    expect(schedule[0].scheduleKey).toBe('med-1:2026-08-27:08:00');
  });

  it('attaches the latest witnessed record to its scheduled dose', () => {
    const state = board();
    const date = new Date(2026, 7, 27, 12, 0);
    state.logs.push({
      id: 'dose-1', scheduleKey: 'med-1:2026-08-27:08:00', medicationId: 'med-1',
      dueAt: new Date(2026, 7, 27, 8).toISOString(), status: 'given', witness: 'JR', note: '',
      recordedAt: '2026-08-27T08:01:00.000Z', updatedAt: '2026-08-27T08:01:00.000Z',
    });
    expect(scheduleForDate(state, date)[0].log?.status).toBe('given');
  });
});

describe('handoff merge', () => {
  it('keeps newer records while retaining records unique to each device', () => {
    const current = board();
    current.medications[0].name = 'Old name';
    const incoming = structuredClone(current);
    incoming.updatedAt = '2026-08-27T10:00:00.000Z';
    incoming.medications[0].name = 'Current name';
    incoming.medications[0].updatedAt = '2026-08-27T09:00:00.000Z';
    incoming.medications.push({ ...incoming.medications[0], id: 'med-2', name: 'Second medication' });
    const merged = mergeStates(current, incoming);
    expect(merged.medications).toHaveLength(2);
    expect(merged.medications.find(item => item.id === 'med-1')?.name).toBe('Current name');
  });
});
