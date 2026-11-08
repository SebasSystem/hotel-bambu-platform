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
  test('with a WhatsApp number the header shows WhatsApp and phone and fits (C2 overflow) @mobile', async ({
    page,
  }) => {
    const number = original ?? TEST_NUMBER;
    await expect
      .poll(async () => (await (await page.request.get('/')).text()).includes(`wa.me/${number}`), {
        timeout: 20_000,
      })
      .toBe(true);
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    const banner = page.getByRole('banner');
    const headerWhatsApp = banner.locator(`a[href*="wa.me/${number}"]`).filter({ visible: true });
    const headerPhone = banner.locator('a[href^="tel:"]').filter({ visible: true });
    const hasPhone = (await banner.locator('a[href^="tel:"]').count()) > 0;
    if (test.info().project.name === 'mobile') {
      // Phones: call icon in the header when the hotel has a phone, WhatsApp in the floating button.
      if (hasPhone) await expect(headerPhone).toHaveCount(1);
      else await expect(headerWhatsApp).toBeVisible();
      await page.mouse.wheel(0, 2000);
      await expect(page.locator(`.whatsapp-fab a[href*="wa.me/${number}"]`)).toBeVisible();
    } else {
      // Desktop: verb-first WhatsApp button, plus the phone next to it when one is set.
      await expect(headerWhatsApp).toHaveAccessibleName(/Escribir por WhatsApp/);
      if (hasPhone) await expect(headerPhone).toHaveCount(1);
    }
    // WhatsApp replaces the phone fallback in the hero.
    await expect(page.locator('#inicio a[href^="tel:"]')).toHaveCount(0);
  });
});
