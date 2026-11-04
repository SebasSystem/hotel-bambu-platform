import { isPublishableMedia } from '../media/media-url.js';

/** Publication rules for rooms (requirements 9.4 and 10). Pure: unit tested without a database. */

export interface RoomForPublication {
  name: string;
  slug: string;
  shortDescription: string | null;
  capacity: number;
  images: { isCover: boolean; mediaAsset: { status: string; altText: string | null } }[];
}

export type RoomPublicationIssue = 'name' | 'slug' | 'shortDescription' | 'capacity' | 'coverImage';

export const ROOM_PUBLICATION_MESSAGES: Record<RoomPublicationIssue, string> = {
  name: 'Name is required.',
  slug: 'Slug is required.',
  shortDescription: 'Short description is required.',
  capacity: 'Capacity must be at least 1.',
  coverImage: 'A processed cover image with alternative text is required.',
};

/** Missing minimum fields to publish: name, slug, short description, capacity, cover with alt text. */
export function roomPublicationIssues(room: RoomForPublication): RoomPublicationIssue[] {
  const issues: RoomPublicationIssue[] = [];
  if (!room.name.trim()) issues.push('name');
  if (!room.slug.trim()) issues.push('slug');
  if (!room.shortDescription?.trim()) issues.push('shortDescription');
  if (!(room.capacity >= 1)) issues.push('capacity');
  const cover = room.images.find((image) => image.isCover);
  if (!cover || !isPublishableMedia(cover.mediaAsset)) issues.push('coverImage');
  return issues;
}

export interface SlugChangeInput {
  roomId: string;
  currentSlug: string;
  newSlug: string;
  isPublished: boolean;
  /** Another room already uses `newSlug`. */
  takenByOtherRoom: boolean;
  /** Owner of an existing redirect from `newSlug`, if any. */
  redirectOwnerRoomId: string | null;
}

export type SlugChangePlan =
  | { kind: 'noop' }
  | { kind: 'conflict' }
  | { kind: 'change'; createRedirectFrom: string | null; deleteRedirectFrom: string | null };

/**
 * Renaming a published room keeps its old URL alive with a 301 (RoomSlugRedirect). A slug that is
 * an old URL of another room is reserved; taking back one's own old slug removes that redirect.
 */
export function planSlugChange(input: SlugChangeInput): SlugChangePlan {
  if (input.newSlug === input.currentSlug) return { kind: 'noop' };
  if (input.takenByOtherRoom) return { kind: 'conflict' };
  if (input.redirectOwnerRoomId && input.redirectOwnerRoomId !== input.roomId)
    return { kind: 'conflict' };
  return {
    kind: 'change',
    createRedirectFrom: input.isPublished ? input.currentSlug : null,
    deleteRedirectFrom: input.redirectOwnerRoomId === input.roomId ? input.newSlug : null,
  };
}
