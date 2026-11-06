import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards against drift between the design source of truth and the Tailwind v4 theme.
const root = path.resolve(import.meta.dirname, '../../..');
const tokens = JSON.parse(readFileSync(path.join(root, 'docs/design/tokens.json'), 'utf8'));
const css = readFileSync(path.join(import.meta.dirname, 'tokens.css'), 'utf8');

/** Collects every `--name: value;` declaration (last one wins). */
const declarations = new Map(
  [...css.matchAll(/(--[\w.-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
);

/** Prettier rewrites `0.10` as `0.1`; compare numbers without trailing decimal zeros. */
function normalize(value: string): string {
  return value.replace(/(\d\.\d*?)0+(?=\D|$)/g, '$1');
}

function cssVar(name: string): string | undefined {
  return declarations.get(`--${name}`);
}

/** Flattens nested token groups, skipping `$note` metadata keys. */
function flatten(obj: Record<string, unknown>, prefix: string): [string, string][] {
  return Object.entries(obj)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null
        ? flatten(value as Record<string, unknown>, `${prefix}-${key}`)
        : [[`${prefix}-${key}`, String(value)]],
    );
}

/** Resolves `{color.green-900}` references to the CSS variable that must hold them. */
function referenceToVar(ref: string): string {
  const match = /^\{color\.(.+)\}$/.exec(ref);
  if (!match) throw new Error(`Unsupported token reference ${ref}`);
  return `var(--color-${match[1]!.replace(/\./g, '-')})`;
}

/** WCAG 2.2 relative luminance of an opaque `#rrggbb` colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light! + 0.05) / (dark! + 0.05);
}

const colors = tokens.color as Record<string, string>;

describe('tokens.css mirrors docs/design/tokens.json', () => {
  it.each(Object.entries(colors))('primitive color-%s = %s', (name, value) => {
    expect(cssVar(`color-${name}`)?.toLowerCase()).toBe(value.toLowerCase());
  });

  it.each(Object.entries(tokens.semantic as Record<string, string>))(
    'semantic %s maps to %s and is exposed as a Tailwind colour',
    (name, ref) => {
      expect(cssVar(name)).toBe(referenceToVar(ref));
      expect(cssVar(`color-${name}`)).toBe(`var(--${name})`);
    },
  );

  it.each([
    ...flatten(tokens.radius, 'radius'),
    ...flatten(tokens.shadow, 'shadow'),
    ...flatten(tokens.font.size, 'text'),
    ...flatten(tokens.font['line-height'], 'leading'),
    ...flatten(tokens.font['letter-spacing'], 'tracking'),
    ...flatten(tokens.breakpoint, 'breakpoint'),
    ...flatten(tokens.motion.easing, 'ease'),
    ...flatten(tokens.motion.duration, 'duration'),
    ...flatten(tokens.z, 'z'),
  ])('%s = %s', (name, value) => {
    expect(normalize(cssVar(name) ?? '')).toBe(normalize(value));
  });

  it('layout tokens', () => {
    expect(cssVar('spacing')).toBe(tokens.spacing['base-unit']);
    expect(cssVar('section-y')).toBe(tokens.spacing['section-y']);
    expect(cssVar('gutter')).toBe(tokens.spacing.gutter);
    expect(cssVar('header-gutter')).toBe(tokens.spacing['header-gutter']);
    expect(cssVar('container-site')).toBe(tokens.spacing['container-max']);
  });

  it('font stacks start with the next/font variable and keep the token fallbacks', () => {
    const fallback = (stack: string) => stack.split(',').slice(1).join(',').trim();
    expect(cssVar('font-display')).toBe(
      `var(--font-gilda), ${fallback(tokens.font.family.display)}`,
    );
    expect(cssVar('font-sans')).toBe(`var(--font-dm-sans), ${fallback(tokens.font.family.sans)}`);
  });

  it('declares no legacy palette aliases (bamboo, sand-100, ink-900… were removed in D4)', () => {
    const legacy = [...declarations.keys()].filter((name = '') =>
      /^--color-(bamboo|cane|sand|ink|earth|error)-\d+$/.test(name),
    );
    expect(legacy).toEqual([]);
  });
});

describe('palette contrast (WCAG 2.2)', () => {
  const pairs = (key: 'text' | 'non-text') =>
    (tokens.contrast[key] as [string, string][]).map(([fg, bg]) => [
      fg,
      bg,
      colors[fg]!,
      colors[bg]!,
    ]);

  it.each(pairs('text'))('text %s on %s reaches 4.5:1', (_fg, _bg, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(pairs('non-text'))('focus ring %s on %s reaches 3:1', (_fg, _bg, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it('the mockup muted grey would fail on ivory (regression guard for the fix)', () => {
    expect(contrast('#6d756f', colors.ivory!)).toBeLessThan(4.5);
    expect(contrast(colors['ink-muted']!, colors.ivory!)).toBeGreaterThanOrEqual(4.5);
  });

  it('the semantic focus rings use the checked colours', () => {
    expect(tokens.semantic.ring).toBe('{color.green}');
    expect(tokens.semantic['ring-on-dark']).toBe('{color.gold}');
  });
});
