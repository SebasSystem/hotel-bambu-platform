import { describe, expect, it } from 'vitest';
import {
  planSlugChange,
  roomTypePublicationIssues,
  type RoomTypeForPublication,
} from './room-type-rules.js';

const readyCover = { isCover: true, mediaAsset: { status: 'READY', altText: 'Cama doble' } };
const roomType: RoomTypeForPublication = {
  name: 'Habitación de pareja',
  slug: 'habitacion-pareja',
  capacity: 2,
  images: [readyCover],
};

describe('roomTypePublicationIssues', () => {
  it('accepts a type with every minimum field, without a description', () => {
    expect(roomTypePublicationIssues(roomType)).toEqual([]);
  });

  it('requires a name and capacity', () => {
    expect(roomTypePublicationIssues({ ...roomType, name: '  ', capacity: 0 })).toEqual([
      'name',
      'capacity',
    ]);
  });

  it('requires a cover image', () => {
    expect(
      roomTypePublicationIssues({ ...roomType, images: [{ ...readyCover, isCover: false }] }),
    ).toEqual(['coverImage']);
  });

  it('rejects a cover that is not processed or has no alt text', () => {
    const processing = { isCover: true, mediaAsset: { status: 'PROCESSING', altText: 'x' } };
    const noAlt = { isCover: true, mediaAsset: { status: 'READY', altText: null } };
    expect(roomTypePublicationIssues({ ...roomType, images: [processing] })).toEqual([
      'coverImage',
    ]);
    expect(roomTypePublicationIssues({ ...roomType, images: [noAlt] })).toEqual(['coverImage']);
  });
});

describe('planSlugChange', () => {
  const input = {
    ownerId: 'type-1',
    currentSlug: 'old',
    newSlug: 'new',
    isPublished: true,
    takenByOther: false,
    redirectOwnerId: null,
  };

  it('creates a 301 redirect from the old slug of a published type', () => {
    expect(planSlugChange(input)).toEqual({
      kind: 'change',
      createRedirectFrom: 'old',
      deleteRedirectFrom: null,
    });
  });

  it('does not create redirects for drafts', () => {
    expect(planSlugChange({ ...input, isPublished: false })).toEqual({
      kind: 'change',
      createRedirectFrom: null,
      deleteRedirectFrom: null,
    });
  });

  it('is a no-op when the slug does not change', () => {
    expect(planSlugChange({ ...input, newSlug: 'old' })).toEqual({ kind: 'noop' });
  });

  it('refuses a slug used by another type or reserved by its redirect', () => {
    expect(planSlugChange({ ...input, takenByOther: true })).toEqual({ kind: 'conflict' });
    expect(planSlugChange({ ...input, redirectOwnerId: 'type-2' })).toEqual({
      kind: 'conflict',
    });
  });

  it("taking back one's own old slug removes that redirect (no loop)", () => {
    expect(planSlugChange({ ...input, redirectOwnerId: 'type-1' })).toEqual({
      kind: 'change',
      createRedirectFrom: 'old',
      deleteRedirectFrom: 'new',
    });
  });
});
