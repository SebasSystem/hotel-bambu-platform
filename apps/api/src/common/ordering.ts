import { UnprocessableEntityException } from '@nestjs/common';

/** Next sortOrder after the current maximum (new items go last). */
export function nextSortOrder(max: number | null | undefined): number {
  return (max ?? -1) + 1;
}

/** Ensures a reorder request names only existing rows. */
export function assertAllFound(found: number, requested: number): void {
  if (found !== requested) throw new UnprocessableEntityException('Unknown id in order.');
}
