import { describe, expect, it } from 'vitest';
import { planSlugChange, roomPublicationIssues, type RoomForPublication } from './room-rules.js';

const readyCover = { isCover: true, mediaAsset: { status: 'READY', altText: 'Cama doble' } };
const room: RoomForPublication = {
  name: 'Habitación Pareja 101',
  slug: 'habitacion-pareja-101',
  shortDescription: 'Para dos personas.',
  capacity: 2,
  images: [readyCover],
};

describe('roomPublicationIssues', () => {
  it('accepts a room with every minimum field', () => {
    expect(roomPublicationIssues(room)).toEqual([]);
  });

  it('requires a short description and capacity', () => {
    expect(roomPublicationIssues({ ...room, shortDescription: '  ', capacity: 0 })).toEqual([
      'shortDescription',
      'capacity',
    ]);
  });

  it('requires a cover image', () => {
    expect(roomPublicationIssues({ ...room, images: [{ ...readyCover, isCover: false }] })).toEqual(
      ['coverImage'],
    );
  });

  it('rejects a cover that is not processed or has no alt text', () => {
    const processing = { isCover: true, mediaAsset: { status: 'PROCESSING', altText: 'x' } };
    const noAlt = { isCover: true, mediaAsset: { status: 'READY', altText: null } };
    expect(roomPublicationIssues({ ...room, images: [processing] })).toEqual(['coverImage']);
    expect(roomPublicationIssues({ ...room, images: [noAlt] })).toEqual(['coverImage']);
  });
});

describe('planSlugChange', () => {
  const input = {
    roomId: 'room-1',
    currentSlug: 'old',
    newSlug: 'new',
    isPublished: true,
    takenByOtherRoom: false,
    redirectOwnerRoomId: null,
  };

  it('creates a 301 redirect from the old slug of a published room', () => {
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

  it('refuses a slug used by another room or reserved by its redirect', () => {
    expect(planSlugChange({ ...input, takenByOtherRoom: true })).toEqual({ kind: 'conflict' });
    expect(planSlugChange({ ...input, redirectOwnerRoomId: 'room-2' })).toEqual({
      kind: 'conflict',
    });
  });

  it("taking back one's own old slug removes that redirect (no loop)", () => {
    expect(planSlugChange({ ...input, redirectOwnerRoomId: 'room-1' })).toEqual({
      kind: 'change',
      createRedirectFrom: 'old',
      deleteRedirectFrom: 'new',
    });
  });
});
