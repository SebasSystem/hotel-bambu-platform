import { expect, test } from '@playwright/test';
import { adminApi, type AdminApi } from '../support/api';
import { firstRoomPath, rejectCookies } from '../support/pages';

const TEST_NUMBER = '573001234567';

/** WhatsApp CTA (requirement 5): number and room name in the prepared message. */
test.describe('whatsapp', () => {
  let api: AdminApi;
  let original: string | null;

  test.beforeAll(async () => {
    api = await adminApi();
    original = (await api.get<{ whatsappNumber: string | null }>('/admin/hotel')).whatsappNumber;
    if (!original) await api.send('PATCH', '/admin/hotel', { whatsappNumber: TEST_NUMBER });
  });

  test.afterAll(async () => {
    if (!original) await api.send('PATCH', '/admin/hotel', { whatsappNumber: null });
    await api.dispose();
  });

  test('room CTA opens WhatsApp with the number and the room name @mobile', async ({ page }) => {
    const number = original ?? TEST_NUMBER;
    const path = await firstRoomPath(page);
    // Revalidation after the profile change is asynchronous.
    await expect
      .poll(async () => (await (await page.request.get(path)).text()).includes(`wa.me/${number}`), {
        timeout: 20_000,
      })
      .toBe(true);

    await page.goto(path);
    await rejectCookies(page);
    const roomName = (await page.getByRole('heading', { level: 1 }).textContent())?.trim() ?? '';
    const cta = page.getByRole('main').locator(`a[href*="wa.me/${number}"]`).first();
    await expect(cta).toBeVisible();
    const href = (await cta.getAttribute('href')) ?? '';
    const message = new URL(href).searchParams.get('text') ?? '';
    expect(roomName).not.toBe('');
    expect(message).toContain(roomName);
    await expect(cta).toHaveAttribute('target', '_blank');
    await expect(cta).toHaveAttribute('rel', /noopener/);
  });
});
