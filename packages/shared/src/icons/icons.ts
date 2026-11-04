import { z } from 'zod';

/**
 * Controlled icon catalog (requirement 9.6 / 15.5). Keys are Lucide icon names (art direction:
 * Lucide, 1.5 px stroke). Admins pick from this list; arbitrary SVG uploads are not allowed (16.5).
 */
export const ICON_KEYS = [
  'bath',
  'shower-head',
  'tv',
  'fan',
  'wifi',
  'router',
  'sun',
  'solar-panel',
  'droplets',
  'bed-single',
  'bed-double',
  'users',
  'clock',
  'key-round',
  'shield-check',
  'map-pin',
  'car',
  'coffee',
  'utensils',
  'mountain',
  'trees',
  'sparkles',
  'phone',
  'message-circle',
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

export const iconKeySchema = z.enum(ICON_KEYS);
