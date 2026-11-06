import { expect, test } from '@playwright/test';
import { firstRoomPath, jsonLd, rejectCookies } from '../support/pages';

test.describe('public site', () => {
  test('home renders server content without CSP violations @mobile', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (/Content[- ]Security[- ]Policy/i.test(message.text())) violations.push(message.text());
    });
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    // The consent banner is part of the server HTML for a first visit.
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
    expect(violations).toEqual([]);
    const hotel = (await jsonLd(page)).find((block) => block['@type'] === 'Hotel');
    expect(hotel?.name).toBeTruthy();
  });

  test('rooms list links to a room detail with canonical and structured data', async ({ page }) => {
    const path = await firstRoomPath(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`${path}$`),
    );
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
      'content',
      /\S/,
    );
    const types = (await jsonLd(page)).map((block) => block['@type']);
    expect(types).toContain('BreadcrumbList');
    expect(types.some((type) => type === 'HotelRoom' || type === 'Offer')).toBe(true);
  });

  test('unknown URLs answer a branded 404 with links to the rooms', async ({ page }) => {
    const response = await page.goto('/esta-pagina-no-existe');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(
      page
        .getByRole('main')
        .getByRole('link', { name: /habitaciones/i })
        .first(),
    ).toBeVisible();
  });

  test('reduced motion keeps every section visible', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await rejectCookies(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const hidden = await page
      .locator('main section')
      .evaluateAll(
        (sections) =>
          sections.filter((section) => Number(getComputedStyle(section).opacity) < 1).length,
      );
    expect(hidden).toBe(0);
    const revealHidden = await page
      .locator('[data-reveal]')
      .evaluateAll(
        (nodes) => nodes.filter((node) => Number(getComputedStyle(node).opacity) < 1).length,
      );
    expect(revealHidden).toBe(0);
    await context.close();
  });
});

test.describe('catalogue and gallery (mockup port)', () => {
  test('room type chips are shareable links with a live count', async ({ page }) => {
    await page.goto('/habitaciones');
    const chips = page.getByRole('navigation', { name: 'Filtrar por tipo de habitación' });
    const links = chips.getByRole('link');
    test.skip((await links.count()) < 3, 'Needs at least two published room types');
    await expect(links.first()).toHaveAttribute('aria-current', 'page');
    const target = links.nth(1);
    const label = (await target.textContent())?.trim() ?? '';
    await target.click();
    await expect(page).toHaveURL(/\?tipo=[a-z]+$/);
    await expect(chips.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('main [aria-live="polite"]')).toHaveText(/\d+ habitaci/);
    const kickers = await page.locator('main article p:first-of-type').allTextContents();
    expect(kickers.every((text) => text.trim().toLowerCase() === label.toLowerCase())).toBe(true);
  });

  test('gallery lightbox traps focus, closes on Escape and frees the page @mobile', async ({
    page,
  }) => {
    await page.goto('/galeria');
    await rejectCookies(page);
    const tiles = page.getByRole('button', { name: /^Ampliar imagen/ });
    test.skip((await tiles.count()) === 0, 'Needs published gallery photos');
    await tiles.first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(tiles.first()).toBeFocused();
    // Nothing is left over the page: a normal link still navigates.
    await page.getByRole('contentinfo').getByRole('link', { name: 'Habitaciones' }).click();
    await expect(page).toHaveURL(/\/habitaciones$/);
  });
});

test.describe('seo and headers', () => {
  test('security headers on a public page', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['content-security-policy']).toMatch(
      /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
    );
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('robots.txt and sitemap.xml', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/User-Agent: \*/i);
    expect(robots).toMatch(/Disallow: \/(admin)?/);
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain('<urlset');
    expect(xml).toMatch(/\/habitaciones\/[a-z0-9-]+<\/loc>/);
    expect(xml).not.toContain('/admin');
  });

  test('legal pages stay noindex until approved and list pending items', async ({ page }) => {
    await page.goto('/legal/tratamiento-de-datos');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/tratamiento de datos/i);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('[data-legal-draft]')).toContainText('TODO(hotel)');
  });

  test('admin pages are private and not indexable', async ({ request }) => {
    const response = await request.get('/admin/login');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  });
});
