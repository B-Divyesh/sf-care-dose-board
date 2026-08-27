import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 2048,
  },
});
