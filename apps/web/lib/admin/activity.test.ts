import { describe, expect, it } from 'vitest';
import { collapseActivity, describeAction, isContentChange, timeAgo } from './activity';

describe('audit activity wording', () => {
  it('describes content changes in Spanish', () => {
    expect(describeAction('roomType.status')).toBe('Tipo de habitación: estado cambiado');
    expect(describeAction('social_link.create')).toBe('Red social: creado');
    expect(describeAction('hotel.update')).toBe('Datos del hotel: actualizado');
  });

  it('leaves sign-ins and migrations out of the activity list', () => {
    expect(isContentChange('auth.login')).toBe(false);
    expect(isContentChange('system.migration')).toBe(false);
    expect(isContentChange('media.upload')).toBe(true);
  });

  it('formats relative times', () => {
    const now = new Date('2026-11-05T15:00:00Z');
    expect(timeAgo('2026-11-05T14:59:30Z', now)).toBe('ahora');
    expect(timeAgo('2026-11-05T14:55:00Z', now)).toBe('hace 5 minutos');
    expect(timeAgo('2026-11-05T12:00:00Z', now)).toBe('hace 3 horas');
    expect(timeAgo('2026-11-04T15:00:00Z', now)).toBe('ayer');
  });

  it('merges consecutive repeats of the same change into one row with a count', () => {
    const entry = (id: string, action: string, entityId: string | null = '1') => ({
      id,
      action,
      entityId,
      createdAt: '2026-11-05T14:00:00Z',
      adminUser: { email: 'a@example.test', name: null },
    });
    const rows = collapseActivity([
      entry('a', 'hotel.update'),
      entry('b', 'hotel.update'),
      entry('c', 'auth.login', null),
      entry('d', 'hotel.update'),
      entry('e', 'room.update', '7'),
      entry('f', 'hotel.update'),
    ]);
    expect(rows.map((row) => [row.id, row.count])).toEqual([
      ['a', 3],
      ['e', 1],
      ['f', 1],
    ]);
  });
});
