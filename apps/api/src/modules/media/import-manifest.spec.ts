import { describe, expect, it } from 'vitest';
import { assignRoomPhotos, planImport, type ManifestEntry } from './import-manifest.js';

const entry = (overrides: Partial<ManifestEntry>): ManifestEntry => ({
  file: 'a.jpeg',
  category: 'room',
  roomType: null,
  quality: 'ok',
  people: false,
  altEs: 'Habitación con cama doble',
  ...overrides,
});

describe('planImport', () => {
  it('skips discarded photos and maps categories', () => {
    const plan = planImport([
      entry({ file: 'keep.jpeg', category: 'common' }),
      entry({ file: 'drop.jpeg', quality: 'discard' }),
      entry({ file: 'room.jpeg', roomType: 'couple' }),
    ]);
    expect(plan.map((p) => p.file)).toEqual(['keep.jpeg', 'room.jpeg']);
    expect(plan[0]).toMatchObject({ galleryCategory: 'COMMON_AREAS', isRoomPhoto: false });
    expect(plan[1]).toMatchObject({
      galleryCategory: 'ROOMS',
      isRoomPhoto: true,
      roomType: 'COUPLE',
    });
  });

  it('marks photos with people or needing edits as not publishable', () => {
    const [withPeople, needsEdit, ok] = planImport([
      entry({ people: true }),
      entry({ quality: 'needs-edit' }),
      entry({}),
    ]);
    expect(withPeople?.publishable).toBe(false);
    expect(needsEdit?.publishable).toBe(false);
    expect(ok?.publishable).toBe(true);
  });
});

describe('assignRoomPhotos', () => {
  const rooms = [
    { id: 'c1', type: 'COUPLE' as const },
    { id: 'i1', type: 'INDIVIDUAL' as const },
    { id: 'c2', type: 'COUPLE' as const },
  ];

  it('rotates typed photos across rooms of the same type', () => {
    const photos = [1, 2, 3].map(() => ({ roomType: 'COUPLE' as const }));
    expect(assignRoomPhotos(photos, rooms).map((a) => a.room.id)).toEqual(['c1', 'c2', 'c1']);
  });

  it('places typed photos first, then fills the least-loaded rooms with untyped photos', () => {
    const photos = [
      { id: 'u1', roomType: null },
      { id: 't1', roomType: 'COUPLE' as const },
      { id: 'u2', roomType: null },
      { id: 'u3', roomType: null },
    ];
    expect(assignRoomPhotos(photos, rooms).map((a) => `${a.photo.id}->${a.room.id}`)).toEqual([
      't1->c1',
      'u1->i1',
      'u2->c2',
      'u3->c1',
    ]);
  });

  it('returns nothing when there are no rooms', () => {
    expect(assignRoomPhotos([{ roomType: null }], [])).toEqual([]);
  });
});
