import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards against drift between the design source of truth and the Tailwind v4 theme.
const root = path.resolve(import.meta.dirname, '../../..');
const tokens = JSON.parse(readFileSync(path.join(root, 'docs/design/tokens.json'), 'utf8'));
const css = readFileSync(path.join(import.meta.dirname, 'tokens.css'), 'utf8');

/** Collects every `--name: value;` declaration (last one wins). */
const declarations = new Map(
  [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
);

/** Prettier rewrites `0.10` as `0.1`; compare numbers without trailing decimal zeros. */
function normalize(value: string): string {
  return value.replace(/(\d\.\d*?)0+(?=\D|$)/g, '$1');
}

function cssVar(name: string): string | undefined {
  return declarations.get(`--${name}`);
}

function flatten(obj: Record<string, unknown>, prefix: string): [string, string][] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flatten(value as Record<string, unknown>, `${prefix}-${key}`)
      : [[`${prefix}-${key}`, String(value)]],
  );
}

/** Resolves `{color.sand.50}` references to the CSS variable that must hold them. */
function referenceToVar(ref: string): string {
  const match = /^\{color\.(.+)\}$/.exec(ref);
  if (!match) throw new Error(`Unsupported token reference ${ref}`);
  return `var(--color-${match[1]!.replace(/\./g, '-')})`;
}

describe('tokens.css mirrors docs/design/tokens.json', () => {
  it.each(flatten(tokens.color, 'color'))('primitive %s = %s', (name, value) => {
    expect(cssVar(name)?.toLowerCase()).toBe(value.toLowerCase());
  });

  it.each(Object.entries(tokens.semantic as Record<string, string>))(
    'semantic %s maps to %s and is exposed as a Tailwind colour',
    (name, ref) => {
      expect(cssVar(name)).toBe(referenceToVar(ref));
      // A role named like a primitive (`whatsapp`) is already a Tailwind colour via the primitive.
      if (!(name in tokens.color)) {
        expect(cssVar(`color-${name}`)).toBe(`var(--${name})`);
      }
    },
  );

  it.each([
    ...flatten(tokens.radius, 'radius'),
    ...flatten(tokens.shadow, 'shadow'),
    ...flatten(tokens.font.size, 'text'),
    ...flatten(tokens.font['line-height'], 'leading'),
    ...flatten(tokens.font['letter-spacing'], 'tracking'),
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
    expect(cssVar('container-site')).toBe(tokens.spacing['container-max']);
  });

  it('font stacks start with the next/font variable and keep the token fallbacks', () => {
    const fallback = (stack: string) => stack.split(',').slice(1).join(',').trim();
    expect(cssVar('font-display')).toBe(
      `var(--font-fraunces), ${fallback(tokens.font.family.display)}`,
    );
    expect(cssVar('font-sans')).toBe(`var(--font-manrope), ${fallback(tokens.font.family.sans)}`);
  });
});
