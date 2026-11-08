import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, adminApi } from '../support/api';
import { loginAsAdmin, rejectCookies } from '../support/pages';

test.describe('admin', () => {
  test('admin routes redirect to the login page when logged out', async ({ page }) => {
    await page.goto('/admin/rooms');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Frooms$/);
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
  });

  test('one Comodidades catalog filters by scope and has no Servicios section', async ({
    page,
  }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Correo electrónico').fill(ADMIN_EMAIL);
    await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);

    await expect(page.getByRole('link', { name: 'Servicios', exact: true })).toHaveCount(0);
    await page.goto('/admin/amenities');
    const filters = page.getByRole('group', { name: 'Filtrar por alcance' });
    await filters.getByRole('button', { name: /^Del hotel/ }).click();
    await expect(page.getByText('Wi-Fi en todo el hotel', { exact: true })).toBeVisible();
    await expect(page.getByText('Baño privado', { exact: true })).toHaveCount(0);
    await filters.getByRole('button', { name: /^De habitación/ }).click();
    await expect(page.getByText('Baño privado', { exact: true })).toBeVisible();
    await expect(page.getByText('Wi-Fi en todo el hotel', { exact: true })).toHaveCount(0);
  });

  test('room types, lightweight rooms and nearby places replace promotions and templates', async ({
    page,
  }) => {
    const api = await adminApi();
    const stamp = Date.now().toString(36);
    const name = `Lugar de prueba ${stamp}`;
    try {
      await page.goto('/admin/login');
      await page.getByLabel('Correo electrónico').fill(ADMIN_EMAIL);
      await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page).toHaveURL(/\/admin\/?$/);

      const nav = page.getByRole('navigation').first();
      await expect(nav.getByRole('link', { name: 'Tipos de habitación' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Promociones' })).toHaveCount(0);
      await expect(nav.getByRole('link', { name: 'WhatsApp', exact: true })).toHaveCount(0);

      await page.goto('/admin/room-types');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Tipos de habitación' }),
      ).toBeVisible();
      await expect(
        page.getByRole('columnheader', { name: 'Habitaciones publicadas' }),
      ).toBeVisible();

      await page.goto('/admin/rooms');
      await page.getByRole('button', { name: 'Agregar habitación' }).click();
      const roomForm = page.getByRole('form', { name: 'Nuevo: habitación' });
      for (const label of [/^Número o nombre/, /^Tipo de habitación/, /^Estado/]) {
        await expect(roomForm.getByLabel(label)).toBeVisible();
      }
      await expect(roomForm.getByLabel(/^Capacidad/)).toHaveCount(0);
      await roomForm.getByRole('button', { name: 'Cancelar' }).click();

      await page.goto('/admin/nearby-places');
      await page.getByRole('button', { name: 'Agregar lugar' }).click();
      const form = page.getByRole('form', { name: 'Nuevo: lugar' });
      await form.getByLabel(/^Nombre/).fill(name);
      await form.getByLabel(/^Distancia/).fill('300 m');
      await form.getByRole('button', { name: 'Agregar' }).click();
      await expect(page.getByText(name, { exact: true })).toBeVisible();
      await expect(page.getByText('300 m', { exact: true })).toBeVisible();
    } finally {
      const places = await api.get<{ id: string; name: string }[]>('/admin/nearby-places');
      for (const place of places.filter((p) => p.name === name)) {
        await api.send('DELETE', `/admin/nearby-places/${place.id}`);
      }
      await api.dispose();
    }
  });

  test('editing a FAQ in the panel shows up on the public site', async ({ page }) => {
    const api = await adminApi();
    const stamp = Date.now().toString(36);
    const question = `¿Pregunta de prueba ${stamp}?`;
    const edited = `¿Pregunta editada ${stamp}?`;
    const faq = await api.send<{ id: string }>('POST', '/admin/faq', {
      question,
      answer: 'Respuesta creada por las pruebas end-to-end.',
      published: true,
      showOnHome: false,
    });
    try {
      await page.goto('/admin/login');
      await page.getByLabel('Correo electrónico').fill(ADMIN_EMAIL);
      await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page).toHaveURL(/\/admin\/?$/);

      // FAQ and policies share one admin page (the old route redirects).
      await page.goto('/admin/faq');
      await expect(page).toHaveURL(/\/admin\/policies#preguntas$/);
      await page.getByRole('button', { name: `Editar ${question}` }).click();
      const form = page.getByRole('form', { name: 'Editar pregunta' });
      await form.getByRole('textbox', { name: /^Pregunta/ }).fill(edited);
      await form.getByRole('button', { name: 'Guardar cambios' }).click();
      await expect(page.getByText(edited)).toBeVisible();

      // Revalidation (API → POST /api/revalidate) refreshes the public page within seconds.
      await expect
        .poll(
          async () =>
            (await (await page.request.get('/informacion-para-huespedes')).text()).includes(edited),
          { timeout: 20_000 },
        )
        .toBe(true);
      await page.goto('/informacion-para-huespedes');
      await rejectCookies(page);
      await expect(page.getByText(edited)).toBeVisible();
    } finally {
      await api.send('DELETE', `/admin/faq/${faq.id}`);
      await api.dispose();
    }
  });

  test('dashboard readiness, grouped navigation, inline publish switch and section switches', async ({
    page,
  }) => {
    const api = await adminApi();
    const types = await api.get<{ id: string; status: string }[]>('/admin/room-types');
    const type = types.find((t) => t.status === 'PUBLISHED') ?? types[0]!;
    const name = `E2E ${Date.now().toString(36)}`;
    const room = await api.send<{ id: string }>('POST', '/admin/rooms', {
      name,
      roomTypeId: type.id,
      status: 'DRAFT',
    });
    try {
      await loginAsAdmin(page);

      // Content-readiness dashboard: KPIs and the "Antes de publicar" checklist, no bookings.
      await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible();
      await expect(page.getByText('Tipos de habitación publicados')).toBeVisible();
      await expect(page.getByText('Fotos con texto alternativo')).toBeVisible();
      const checklist = page.getByRole('region', { name: 'Antes de publicar' });
      await expect(checklist.getByRole('listitem')).toHaveCount(9);
      await expect(checklist.getByRole('link', { name: /^Configurar WhatsApp/ })).toHaveAttribute(
        'href',
        '/admin/hotel#whatsapp',
      );
      await expect(
        page.getByRole('progressbar', { name: 'Avance antes de publicar' }),
      ).toBeVisible();
      await expect(page.getByText(/ocupación|ingresos|reservas/i)).toHaveCount(0);

      // Grouped Spanish navigation.
      const nav = page.getByRole('navigation', { name: 'Panel' });
      for (const group of ['Hotel', 'Habitaciones', 'Contenido', 'Cuenta']) {
        await expect(nav.getByRole('list', { name: group })).toBeVisible();
      }
      await expect(
        nav
          .getByRole('list', { name: 'Contenido' })
          .getByRole('link', { name: 'Carrusel principal' }),
      ).toBeVisible();

      // Inline publish switch: optimistic, persisted through the API.
      await page.goto('/admin/rooms');
      const control = page.getByRole('switch', { name: `Publicar ${name}` });
      await expect(control).toHaveAttribute('aria-checked', 'false');
      await control.click();
      await expect(control).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByRole('status')).toContainText(`«${name}» publicado.`);
      await expect
        .poll(async () => {
          const rooms = await api.get<{ id: string; status: string }[]>('/admin/rooms');
          return rooms.find((r) => r.id === room.id)?.status;
        })
        .toBe('PUBLISHED');

      // Home sections: relabelled switches, no order control.
      await page.goto('/admin/content');
      await expect(
        page.getByRole('switch', {
          name: 'Mostrar «Resumen de información para huéspedes» en la portada',
        }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /^Subir|^Bajar/ })).toHaveCount(0);
    } finally {
      await api.send('DELETE', `/admin/rooms/${room.id}`);
      await api.dispose();
    }
  });

  test('admin drawer on a phone: no horizontal overflow, Escape closes it @mobile', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'The drawer replaces the sidebar on phones only.',
    );
    await loginAsAdmin(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);

    const toggle = page.getByRole('button', { name: 'Abrir menú del panel' });
    await toggle.click();
    const drawer = page.getByRole('dialog', { name: 'Menú del panel' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Tipos de habitación' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(toggle).toBeFocused();

    await toggle.click();
    await drawer.getByRole('link', { name: 'Habitaciones', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/rooms$/);
    await expect(drawer).toBeHidden();
  });
});
