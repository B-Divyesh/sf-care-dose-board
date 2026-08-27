import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { defineConfig } from 'vitest/config';

// The worker contains the digest itself, so it is the only circular release file.
const releaseExcludedFiles = new Set(['sw.js']);

async function releaseFiles(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? releaseFiles(path, root) : [relative(root, path)];
  }));
  return files.flat();
}

/** The worker cache identity is a digest of the files a release can serve. */
async function stampRelease(dist: string): Promise<void> {
  const files = (await releaseFiles(dist)).filter(file => !releaseExcludedFiles.has(file)).sort();
  const digest = createHash('sha256');
  for (const file of files) {
    digest.update(file);
    digest.update(await readFile(join(dist, file)));
  }
  const release = digest.digest('hex').slice(0, 16);
  const worker = (await readFile(join(dist, 'sw.js'), 'utf8')).replaceAll('__RELEASE_ID__', release);
  const manifest = (await readFile(join(dist, 'manifest.webmanifest'), 'utf8')).replaceAll('__RELEASE_ID__', release);
  await Promise.all([
    writeFile(join(dist, 'sw.js'), worker),
    writeFile(join(dist, 'manifest.webmanifest'), manifest),
  ]);
}

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'quality/**/*.test.ts'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 2048,
  },
  plugins: [{
    name: 'dose-witness-release-stamp',
    closeBundle: () => stampRelease('dist'),
  }],
});
