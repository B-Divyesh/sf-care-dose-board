import { normalizeState } from './data';
import type { HouseholdState } from './types';

const ITERATIONS = 250_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface EncryptedHandoff {
  format: 'dose-witness-encrypted';
  version: 1;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function toBase64(bytes: Uint8Array): string {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptState(state: HouseholdState, passphrase: string): Promise<string> {
  if (passphrase.length < 8) throw new Error('Use at least 8 characters for the handoff passphrase.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(state)));
  const handoff: EncryptedHandoff = {
    format: 'dose-witness-encrypted',
    version: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(handoff, null, 2);
}

export async function decryptState(fileText: string, passphrase: string): Promise<HouseholdState> {
  let handoff: EncryptedHandoff;
  try {
    handoff = JSON.parse(fileText) as EncryptedHandoff;
  } catch {
    throw new Error('This is not a Dose Witness handoff file.');
  }
  if (handoff.format !== 'dose-witness-encrypted' || handoff.version !== 1 || handoff.kdf !== 'PBKDF2-SHA-256') {
    throw new Error('This handoff format is not supported.');
  }
  if (!Number.isInteger(handoff.iterations) || handoff.iterations < 100_000 || handoff.iterations > 1_000_000) {
    throw new Error('This handoff uses unsafe or unsupported encryption settings.');
  }
  try {
    const salt = fromBase64(handoff.salt);
    const iv = fromBase64(handoff.iv);
    const ciphertext = fromBase64(handoff.ciphertext);
    const key = await deriveKey(passphrase, salt, handoff.iterations);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return normalizeState(JSON.parse(decoder.decode(plaintext)));
  } catch {
    throw new Error('Could not open this handoff. Check the passphrase and try again.');
  }
}
