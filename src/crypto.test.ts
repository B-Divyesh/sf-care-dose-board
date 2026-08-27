import { describe, expect, it } from 'vitest';
import { decryptState, encryptState } from './crypto';
import type { HouseholdState } from './types';

const state: HouseholdState = {
  version: 1,
  householdName: 'Private board',
  patientName: 'Mae',
  caregiverInitials: 'AK',
  medications: [],
  logs: [],
  audit: [],
  updatedAt: '2026-08-27T08:00:00.000Z',
};

describe('encrypted handoffs', () => {
  it('round-trips household data without plaintext leakage', async () => {
    const encrypted = await encryptState(state, 'long shared phrase');
    expect(encrypted).not.toContain('Private board');
    await expect(decryptState(encrypted, 'long shared phrase')).resolves.toMatchObject({ householdName: 'Private board', patientName: 'Mae' });
  });

  it('rejects a wrong passphrase and short export passphrases', async () => {
    await expect(encryptState(state, 'short')).rejects.toThrow(/8 characters/);
    const encrypted = await encryptState(state, 'correct passphrase');
    await expect(decryptState(encrypted, 'wrong passphrase')).rejects.toThrow(/Check the passphrase/);
  });
});
