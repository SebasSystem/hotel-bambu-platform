import { isPublishableMedia } from '../media/media-url.js';

/** Publication rules for room types (requirements 9.4 and 10). Pure: unit tested without a database. */

export interface RoomTypeForPublication {
  name: string;
  slug: string;
  capacity: number;
  images: { isCover: boolean; mediaAsset: { status: string; altText: string | null } }[];
}

export type RoomTypePublicationIssue = 'name' | 'slug' | 'capacity' | 'coverImage';

export const ROOM_TYPE_PUBLICATION_MESSAGES: Record<RoomTypePublicationIssue, string> = {
  name: 'Name is required.',
  slug: 'Slug is required.',
  capacity: 'Capacity must be at least 1.',
  coverImage: 'A processed cover image with alternative text is required.',
};

/**
 * Missing minimum fields to publish: name, slug, capacity, cover with alt text. The description is
 * optional: the page shows none rather than invented text.
 */
export function roomTypePublicationIssues(
  roomType: RoomTypeForPublication,
): RoomTypePublicationIssue[] {
  const issues: RoomTypePublicationIssue[] = [];
  if (!roomType.name.trim()) issues.push('name');
  if (!roomType.slug.trim()) issues.push('slug');
  if (!(roomType.capacity >= 1)) issues.push('capacity');
  const cover = roomType.images.find((image) => image.isCover);
  if (!cover || !isPublishableMedia(cover.mediaAsset)) issues.push('coverImage');
  return issues;
}

export interface SlugChangeInput {
  ownerId: string;
  currentSlug: string;
  newSlug: string;
  isPublished: boolean;
  /** Another room type already uses `newSlug`. */
  takenByOther: boolean;
  /** Owner of an existing redirect from `newSlug`, if any. */
  redirectOwnerId: string | null;
}

export type SlugChangePlan =
  | { kind: 'noop' }
  | { kind: 'conflict' }
  | { kind: 'change'; createRedirectFrom: string | null; deleteRedirectFrom: string | null };

/**
 * Renaming a published type keeps its old URL alive with a 301 (RoomTypeSlugRedirect). A slug that
 * is an old URL of another type is reserved; taking back one's own old slug removes that redirect.
 */
export function planSlugChange(input: SlugChangeInput): SlugChangePlan {
  if (input.newSlug === input.currentSlug) return { kind: 'noop' };
  if (input.takenByOther) return { kind: 'conflict' };
  if (input.redirectOwnerId && input.redirectOwnerId !== input.ownerId) return { kind: 'conflict' };
  return {
    kind: 'change',
    createRedirectFrom: input.isPublished ? input.currentSlug : null,
    deleteRedirectFrom: input.redirectOwnerId === input.ownerId ? input.newSlug : null,
  };
}
