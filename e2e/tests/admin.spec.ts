import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, adminApi } from '../support/api';
import { rejectCookies } from '../support/pages';

test.describe('admin', () => {
  test('admin routes redirect to the login page when logged out', async ({ page }) => {
    await page.goto('/admin/rooms');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Frooms$/);
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
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
            (await (await page.request.get('/preguntas-frecuentes')).text()).includes(edited),
          { timeout: 20_000 },
        )
        .toBe(true);
      await page.goto('/preguntas-frecuentes');
      await rejectCookies(page);
      await expect(page.getByText(edited)).toBeVisible();
    } finally {
      await api.send('DELETE', `/admin/faq/${faq.id}`);
      await api.dispose();
    }
  });
});
