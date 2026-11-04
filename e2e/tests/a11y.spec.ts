import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { firstRoomPath, rejectCookies } from '../support/pages';

const PAGES = [
  '/',
  '/habitaciones',
  'ROOM',
  '/servicios',
  '/galeria',
  '/ubicacion',
  '/preguntas-frecuentes',
  '/politicas-del-hotel',
  '/contacto',
  '/legal/cookies',
  '/admin/login',
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

type Violation = { id: string; impact?: string | null; nodes: { target: unknown[] }[] };

function summarize(violations: Violation[]) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    target: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));
}

const blocking = (summary: ReturnType<typeof summarize>) =>
  summary.filter((v) => v.impact === 'serious' || v.impact === 'critical');

/**
 * axe on key pages (requirements 18.3, 23.4): no serious or critical violations.
 * Audited with reduced motion: the scroll reveals start at opacity 0 below the fold, which axe
 * would otherwise report as low contrast. The final (visible) state is the same in both modes.
 */
test.describe('accessibility (axe)', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const target of PAGES) {
    test(`axe: ${target} @mobile`, async ({ page }, testInfo) => {
      const path = target === 'ROOM' ? await firstRoomPath(page) : target;
      await page.goto(path);
      if (!path.startsWith('/admin')) await rejectCookies(page);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const summary = summarize(results.violations);
      console.log(`[axe] ${testInfo.project.name} ${path}: ${JSON.stringify(summary)}`);
      expect(blocking(summary)).toEqual([]);
    });
  }

  test('axe: consent banner and preferences dialog @mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
    let results = await new AxeBuilder({ page })
      .withTags(TAGS)
      .include('[data-consent-banner]')
      .analyze();
    expect(blocking(summarize(results.violations))).toEqual([]);
    await page.getByRole('button', { name: 'Configurar preferencias' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    results = await new AxeBuilder({ page }).withTags(TAGS).include('.consent-dialog').analyze();
    expect(blocking(summarize(results.violations))).toEqual([]);
  });
});
