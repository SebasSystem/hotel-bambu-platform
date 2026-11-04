import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Inline (empty) PostCSS config so Vite does not load postcss.config.mjs (Tailwind) for unit tests.
  css: { postcss: { plugins: [] } },
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  test: {
    include: ['{app,components,features,lib,styles}/**/*.test.{ts,tsx}'],
    // Component tests opt into jsdom with a `// @vitest-environment jsdom` docblock.
    environment: 'node',
  },
});
