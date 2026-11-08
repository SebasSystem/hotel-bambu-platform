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
    // HotelRoom only: a Product node would be evaluated for merchant listings (D6).
    expect(types).toContain('HotelRoom');
    expect(JSON.stringify(types)).not.toContain('Product');
  });

  test('room detail lists its equipment and the hotel-wide amenities; /servicios goes home', async ({
    page,
  }) => {
    await page.goto(await firstRoomPath(page));
    const hotelWide = page.getByTestId('hotel-wide-amenities');
    await expect(hotelWide).toContainText('En todo el hotel:');
    await expect(hotelWide).toContainText('Wi-Fi en todo el hotel');
    await expect(
      page.getByRole('navigation').first().getByRole('link', { name: 'Servicios' }),
    ).toHaveCount(0);
    await page.goto('/servicios');
    await expect(page).toHaveURL(/\/$/);
  });

  test('room type pages generate their SEO title from the type and the city', async ({ page }) => {
    await page.goto(await firstRoomPath(page));
    const heading = (await page.getByRole('heading', { level: 1 }).textContent())?.trim() ?? '';
    await expect(page).toHaveTitle(new RegExp(`^${heading} para \\d+ personas?( en [^–]+)? – `));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      new RegExp(`^${heading} para \\d+ personas? en `),
    );
  });

  test('a former per-room URL answers a permanent redirect to its type page', async ({
    request,
  }) => {
    // Slug of a demo room before ADR 0016; the migration maps it to its type.
    const response = await request.get('/habitaciones/demo-habitacion-pareja-101', {
      maxRedirects: 0,
    });
    test.skip(response.status() === 404, 'Needs a database migrated from per-room pages');
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toMatch(/\/habitaciones\/habitacion-pareja$/);
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

test.describe('home structure and contact fallback (C3)', () => {
  test('home follows the approved order with a facts strip and room type cards @mobile', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hotel Bambú Plaza');
    const trust = page.getByRole('region', { name: 'Datos del hotel' });
    await expect(trust).toBeVisible();
    // The RNT is shown in the footer only (owner review 2026-11-08).
    await expect(trust).not.toContainText(/RNT/);
    await expect(page.getByRole('contentinfo')).toContainText(/RNT/);
    // The old room amenity grid is gone; room amenities are chips on the type cards.
    await expect(page.getByRole('heading', { name: 'En todas las habitaciones' })).toHaveCount(0);
    const rooms = page.locator('#habitaciones-title').locator('xpath=ancestor::section[1]');
    await expect(rooms.getByRole('article').first()).toBeVisible();
    await expect(rooms.getByRole('list', { name: 'Incluye' }).first()).toBeVisible();
    const order = await page
      .locator('main section[aria-labelledby]')
      .evaluateAll((sections) => sections.map((s) => s.getAttribute('aria-labelledby')));
    const expected = ['hero-title', 'habitaciones-title', 'datos-title', 'ubicacion-title'];
    expect(order.filter((id) => expected.includes(id ?? ''))).toEqual(expected);
    expect(order.at(-1)).toBe('cierre-title');
  });

  test('without a WhatsApp number every CTA calls the hotel phone', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    test.skip(html.includes('wa.me/'), 'Needs a hotel without a WhatsApp number');
    const call = page
      .getByRole('main')
      .getByRole('link', { name: /^Llamar al \d{3} \d{3} \d{4}$/ });
    await expect(call.first()).toHaveAttribute('href', /^tel:\+?\d+$/);
    await expect(page.locator('.whatsapp-fab')).toHaveCount(0);
    await expect(page.getByRole('banner').locator('a[href^="tel:"]').first()).toBeAttached();
  });

  test('the footer NAP matches the Hotel JSON-LD', async ({ page }) => {
    await page.goto('/');
    const hotel = (await jsonLd(page)).find((block) => block['@type'] === 'Hotel') as {
      name: string;
      telephone?: string;
      address?: Record<string, string>;
    };
    const nap = page.getByTestId('footer-nap');
    await expect(nap).toContainText(hotel.name);
    if (hotel.telephone) await expect(nap).toContainText(hotel.telephone);
    if (hotel.address) {
      const { streetAddress, addressLocality, addressRegion } = hotel.address;
      await expect(nap).toContainText(
        [streetAddress, addressLocality, addressRegion].filter(Boolean).join(', '),
      );
    }
  });

  test('the location page prints the same NAP as the Hotel JSON-LD', async ({ page }) => {
    await page.goto('/ubicacion');
    const hotel = (await jsonLd(page)).find((block) => block['@type'] === 'Hotel') as {
      name: string;
      telephone?: string;
      address?: Record<string, string>;
    };
    const main = page.getByRole('main');
    if (hotel.telephone) await expect(main).toContainText(hotel.telephone);
    if (hotel.address) {
      const { streetAddress, addressLocality, addressRegion } = hotel.address;
      await expect(main).toContainText(
        [streetAddress, addressLocality, addressRegion].filter(Boolean).join(', '),
      );
    }
  });

  test('every public page has one H1, a unique title and description within the limits', async ({
    page,
  }) => {
    const seen = { titles: new Set<string>(), descriptions: new Set<string>() };
    const pages = ['/', '/habitaciones', await firstRoomPath(page), '/galeria', '/ubicacion'];
    for (const path of [...pages, '/informacion-para-huespedes']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const title = await page.title();
      const description =
        (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
      expect(title.length, `${path} title`).toBeLessThanOrEqual(60);
      expect(description.length, `${path} description`).toBeLessThanOrEqual(155);
      expect(description.length, `${path} description`).toBeGreaterThan(50);
      seen.titles.add(title);
      seen.descriptions.add(description);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(new URL(canonical ?? '').pathname.replace(/\/$/, '')).toBe(path.replace(/\/$/, ''));
      await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
        'content',
        /^https?:\/\//,
      );
    }
    expect(seen.titles.size).toBe(6);
    expect(seen.descriptions.size).toBe(6);
  });

  test('no page declares FAQPage or self-serving reviews', async ({ page }) => {
    for (const path of ['/', '/informacion-para-huespedes', '/ubicacion']) {
      await page.goto(path);
      const text = JSON.stringify(await jsonLd(page));
      expect(text).not.toContain('FAQPage');
      expect(text).not.toContain('aggregateRating');
      expect(text).not.toContain('"review"');
    }
  });
});

test.describe('merged pages (C3 redirects)', () => {
  for (const [from, to] of [
    ['/contacto', '/ubicacion'],
    ['/preguntas-frecuentes', '/informacion-para-huespedes'],
    ['/politicas-del-hotel', '/informacion-para-huespedes'],
    ['/servicios', '/'],
  ] as const) {
    test(`${from} answers a 301 to ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(new URL(response.headers()['location'] ?? '', 'http://x').pathname).toBe(to);
    });
  }

  test('the merged pages carry their own H1 and breadcrumbs', async ({ page }) => {
    await page.goto('/ubicacion');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ubicación y cómo llegar');
    await page.goto('/informacion-para-huespedes');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Información para huéspedes');
    const types = (await jsonLd(page)).map((block) => block['@type']);
    expect(types).toContain('BreadcrumbList');
  });
});

test.describe('compact inner-page headers (owner review 2026-11-08)', () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`page content starts above the fold at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      for (const path of [
        '/habitaciones',
        '/galeria',
        '/ubicacion',
        '/informacion-para-huespedes',
      ]) {
        await page.goto(path);
        const header = page
          .getByRole('heading', { level: 1 })
          .locator('xpath=ancestor::div[contains(@class,"bg-sand")][1]');
        const box = await header.boundingBox();
        expect(box, path).not.toBeNull();
        // The sand header ends in the top part of the screen, leaving room for the content.
        expect(box!.y + box!.height, path).toBeLessThan(viewport.height * 0.7);
      }
      await page.goto(await firstRoomPath(page));
      const title = await page.getByRole('heading', { level: 1 }).boundingBox();
      expect(title).not.toBeNull();
      expect(title!.y + title!.height).toBeLessThan(viewport.height);
    });
  }
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
    await expect(page.locator('main [aria-live="polite"]')).toHaveText(/\d+ tipos? de habitaci/);
    const kickers = await page.locator('main article [data-room-kind]').allTextContents();
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
    // Redirected URLs never appear (C3 merges, D3 removal, the guest information rename, old
    // per-room slugs).
    for (const path of [
      '/contacto',
      '/preguntas-frecuentes',
      '/servicios',
      '/politicas-del-hotel',
    ]) {
      expect(xml).not.toContain(`${path}<`);
    }
    expect(xml).not.toContain('/habitaciones/demo-');
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
