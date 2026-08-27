import { createHash } from 'node:crypto';

/**
 * A cache namespace is a fingerprint of every release file except the two
 * files generated from the fingerprint itself (the manifest and worker).
 */
export function releaseRevision(entries) {
  const fingerprint = createHash('sha256');
  for (const [name, content] of [...entries].sort(([left], [right]) => left.localeCompare(right))) {
    fingerprint.update(name);
    fingerprint.update('\0');
    fingerprint.update(createHash('sha256').update(content).digest('hex'));
    fingerprint.update('\n');
  }
  return fingerprint.digest('hex').slice(0, 16);
}
