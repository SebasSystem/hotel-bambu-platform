import { expect, test } from '@playwright/test';
import { adminApi, eventually, type AdminApi } from '../support/api';
import { CONSENT_COOKIE } from '../support/pages';

interface HotelProfile {
  latitude: number | null;
  longitude: number | null;
}

const BANNER = '[data-consent-banner]';
const MAP = 'iframe[src*="google.com/maps"]';

/**
 * Cookie consent (requirement 17.5): equal choices, reject keeps the map unloaded, functional
 * consent loads it, evidence is recorded, the footer reopens the preferences.
 */
test.describe('cookie consent', () => {
  let api: AdminApi;
  let original: HotelProfile;
  let patched = false;

  test.beforeAll(async () => {
    // The location block needs coordinates or an address; set test coordinates if missing.
    api = await adminApi();
    original = await api.get<HotelProfile>('/admin/hotel');
    if (original.latitude === null || original.longitude === null) {
      await api.send('PATCH', '/admin/hotel', { latitude: 1.1489, longitude: -76.6466 });
      patched = true;
    }
  });

  test.afterAll(async () => {
    if (patched) {
      await api.send('PATCH', '/admin/hotel', {
        latitude: original.latitude,
        longitude: original.longitude,
      });
    }
    await api.dispose();
  });

  test('banner offers three equally prominent choices @mobile', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator(BANNER);
    await expect(banner).toBeVisible();
    const buttons = banner.getByRole('button');
    await expect(buttons).toHaveText([
      'Aceptar todas',
      'Rechazar no esenciales',
      'Configurar preferencias',
    ]);
    const classes = await buttons.evaluateAll((nodes) => nodes.map((node) => node.className));
    expect(new Set(classes).size).toBe(1);
    await expect(banner.getByRole('link', { name: /cookies/i })).toBeVisible();
  });

  test('reject keeps the map unloaded; functional consent loads it', async ({ page, context }) => {
    // Revalidation after the coordinates change is asynchronous.
    await expect
      .poll(
        async () => (await (await page.request.get('/ubicacion')).text()).includes('Cargar mapa'),
        {
          timeout: 20_000,
        },
      )
      .toBe(true);

    await page.goto('/ubicacion');
    const evidence = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/public/consents') &&
        response.request().method() === 'POST',
    );
    await page.locator(BANNER).getByRole('button', { name: 'Rechazar no esenciales' }).click();
    expect((await evidence).status()).toBe(204);

    const cookie = (await context.cookies()).find((c) => c.name === CONSENT_COOKIE);
    expect(cookie).toBeDefined();
    const stored = JSON.parse(decodeURIComponent(cookie?.value ?? '{}')) as Record<string, unknown>;
    expect(stored).toMatchObject({ functional: false, analytics: false, marketing: false });
    expect(String(stored.v)).toMatch(/\S/);

    await page.reload();
    await expect(page.locator(BANNER)).toHaveCount(0);
    await expect(page.locator(MAP)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cargar mapa' })).toBeVisible();

    // Reopen from the footer and grant functional cookies only.
    await page.getByRole('contentinfo').getByRole('button', { name: 'Configurar cookies' }).click();
    const dialog = page.getByRole('dialog', { name: 'Preferencias de cookies' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('switch', { name: 'Funcionales' }).check();
    await expect(dialog.getByRole('switch', { name: 'Analíticas' })).not.toBeChecked();
    await dialog.getByRole('button', { name: 'Guardar preferencias' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(MAP)).toHaveCount(1);

    // Server-rendered with the map already loaded on the next visit.
    await page.reload();
    await expect(page.locator(MAP)).toHaveCount(1);

    // Withdrawing functional consent unloads it again (17.5.8).
    await page.getByRole('contentinfo').getByRole('button', { name: 'Configurar cookies' }).click();
    await dialog.getByRole('button', { name: 'Rechazar no esenciales' }).click();
    await expect(page.locator(MAP)).toHaveCount(0);
  });

  test('analytics events are sent only with analytics consent', async ({ page }) => {
    const events: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/api/v1/public/events')) events.push(request.postData() ?? '');
    });
    await page.goto('/habitaciones');
    await page.locator(BANNER).getByRole('button', { name: 'Rechazar no esenciales' }).click();
    await page.goto('/galeria');
    await page.waitForLoadState('networkidle');
    expect(events).toEqual([]);

    await page.getByRole('contentinfo').getByRole('button', { name: 'Configurar cookies' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Aceptar todas' }).click();
    await page.goto('/habitaciones');
    expect(
      await eventually(async () => events.some((body) => body.includes('PAGE_VIEW')), 5_000),
    ).toBe(true);
  });
});
