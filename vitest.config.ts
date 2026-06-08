import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: [
            'packages/types/**/*.test.ts',
            'packages/utils/**/*.test.ts',
            'packages/core/**/*.test.ts',
            'packages/browser-utils/**/*.test.ts',
            'apps/backend/**/*.test.ts',
            'apps/backend/**/*.e2e.ts',
            'scripts/**/*.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['packages/browser/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'frontend',
          include: ['apps/frontend/**/*.test.ts', 'apps/frontend/**/*.test.tsx'],
          environment: 'jsdom',
        },
      },
    ],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
  },
});
