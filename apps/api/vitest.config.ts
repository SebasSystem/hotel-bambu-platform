import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC compiles decorators + emitDecoratorMetadata, which Nest DI needs (esbuild cannot).
export default defineConfig({
  test: {
    globals: false,
    root: './',
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    // Creates/migrates the `hotel_test` database for *.integration.spec.ts (see src/test).
    globalSetup: ['src/test/global-setup.ts'],
    setupFiles: ['src/test/setup-env.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
