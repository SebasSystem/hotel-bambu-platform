import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC compiles decorators + emitDecoratorMetadata, which Nest DI needs (esbuild cannot).
export default defineConfig({
  test: {
    globals: false,
    root: './',
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
