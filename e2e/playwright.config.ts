import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end suite (requirement 23). Runs against a running stack: the web (production build,
 * `docker compose --profile web` with `WEB_COMMAND=start`) and the API. Use `pnpm e2e` from the
 * repository root, which runs this suite inside the official Playwright image on the host network.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results/artifacts',
  globalSetup: './support/global-setup.ts',
  fullyParallel: false,
  // Several specs edit shared admin data (hotel profile, FAQ) and restore it afterwards.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: './test-results/report', open: 'never' }]],
  use: {
    baseURL,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
});
