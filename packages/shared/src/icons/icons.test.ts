import { describe, expect, it } from 'vitest';
import { ICON_KEYS, iconKeySchema } from './icons.js';

describe('icon catalog', () => {
  it('contains the icons needed by the confirmed room amenities and hotel services', () => {
    for (const key of ['bath', 'tv', 'fan', 'wifi', 'sun', 'droplets', 'router']) {
      expect(ICON_KEYS).toContain(key);
    }
  });

  it('has no duplicates and only kebab-case keys', () => {
    expect(new Set(ICON_KEYS).size).toBe(ICON_KEYS.length);
    for (const key of ICON_KEYS) expect(key).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('rejects keys outside the catalog', () => {
    expect(iconKeySchema.safeParse('wifi').success).toBe(true);
    expect(iconKeySchema.safeParse('<script>').success).toBe(false);
  });
});
