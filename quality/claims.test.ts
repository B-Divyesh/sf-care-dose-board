import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('claim inventory', () => {
  it('maps every unique claim id to exactly one tagged browser test', async () => {
    const claims = JSON.parse(await readFile(resolve('.factory/claims.json'), 'utf8')) as Array<{ id: string; test: string }>;
    const source = await readFile(resolve('tests/claims.spec.ts'), 'utf8');
    expect(new Set(claims.map(item => item.id)).size).toBe(claims.length);
    for (const claim of claims) {
      expect(claim.test).toBe(`npm run test:claims -- --grep @claim:${claim.id}`);
      expect(source.match(new RegExp(`@claim:${claim.id}(?![a-z-])`, 'g'))).toHaveLength(1);
    }
    expect(source.match(/@claim:[a-z][a-z-]+/g)).toHaveLength(claims.length);
  });
});
