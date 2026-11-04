import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Inline (empty) PostCSS config so Vite does not load postcss.config.mjs (Tailwind) for unit tests.
  css: { postcss: { plugins: [] } },
  test: {
    include: ['{app,components,features,lib,styles}/**/*.test.ts'],
    environment: 'node',
  },
});
