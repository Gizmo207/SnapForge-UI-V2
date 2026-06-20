import { defineConfig } from 'vitest/config';

// Pure-domain logic is environment-agnostic, but the sanitization gate uses
// isomorphic-dompurify (jsdom under the hood), so we run tests in a node
// environment where that is available.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
