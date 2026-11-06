import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, adminApi } from '../support/api';
import { rejectCookies } from '../support/pages';

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
    await filters.getByRole('button', { name: /^Todo el hotel/ }).click();
    await expect(page.getByText('Wi-Fi en todo el hotel', { exact: true })).toBeVisible();
    await expect(page.getByText('Baño privado', { exact: true })).toHaveCount(0);
    await filters.getByRole('button', { name: /^Habitaciones/ }).click();
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

      await page.goto('/admin/faq');
      await page.getByRole('button', { name: `Editar ${question}` }).click();
      const form = page.getByRole('form', { name: 'Editar pregunta' });
      await form.getByRole('textbox', { name: /^Pregunta/ }).fill(edited);
      await form.getByRole('button', { name: 'Guardar cambios' }).click();
      await expect(page.getByText(edited)).toBeVisible();

      // Revalidation (API → POST /api/revalidate) refreshes the public page within seconds.
      await expect
        .poll(
          async () =>
            (await (await page.request.get('/politicas-del-hotel')).text()).includes(edited),
          { timeout: 20_000 },
        )
        .toBe(true);
      await page.goto('/politicas-del-hotel');
      await rejectCookies(page);
      await expect(page.getByText(edited)).toBeVisible();
    } finally {
      await api.send('DELETE', `/admin/faq/${faq.id}`);
      await api.dispose();
    }
  });
});
