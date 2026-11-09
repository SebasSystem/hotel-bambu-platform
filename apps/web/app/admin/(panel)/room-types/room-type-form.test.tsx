// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FeedbackProvider } from '@/components/admin/feedback';
import type { MediaAsset } from '@/lib/api/types';
import { RoomTypeForm } from './room-type-form';
import { addImageRows, removeImageRow, type ImageRow } from './room-type-images';

const get = vi.fn();
const post = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push }) }));
vi.mock('@/components/admin/admin-context', () => ({ useThumbnail: () => null }));
vi.mock('@/lib/api/browser', () => ({
  browserApi: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const asset = (id: string): MediaAsset =>
  ({ id, status: 'READY', altText: `Foto ${id}`, variants: [] }) as unknown as MediaAsset;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
});

describe('image rows', () => {
  const row = (id: string, isCover = false): ImageRow => ({
    mediaAssetId: id,
    isCover,
    variants: [],
    altText: id,
  });

  it('makes the first added image the cover only when there is none', () => {
    expect(addImageRows([], [asset('a'), asset('b')]).map((r) => r.isCover)).toEqual([true, false]);
    expect(addImageRows([row('x', true)], [asset('a')]).map((r) => r.isCover)).toEqual([
      true,
      false,
    ]);
  });

  it('hands the cover to the first remaining image when the cover is removed', () => {
    const rows = removeImageRow([row('a', true), row('b'), row('c')], 'a');
    expect(rows.map((r) => [r.mediaAssetId, r.isCover])).toEqual([
      ['b', true],
      ['c', false],
    ]);
  });
});

describe('RoomTypeForm (new)', () => {
  afterEach(() => {
    cleanup();
    get.mockReset();
    post.mockReset();
    push.mockReset();
  });

  it('creates the type with the chosen images, cover first, in one request', async () => {
    get.mockResolvedValue({ items: [asset('m1'), asset('m2')], total: 2, page: 1, pageSize: 48 });
    post.mockResolvedValue({ id: 'rt-new', images: [] });
    render(
      <FeedbackProvider>
        <RoomTypeForm room={null} amenities={[]} />
      </FeedbackProvider>,
    );

    await userEvent.type(screen.getByLabelText(/^Nombre/), 'Suite Jardín');
    await userEvent.click(screen.getByRole('button', { name: /Agregar imágenes/ }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(await within(dialog).findByRole('button', { name: /Foto m1/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: /Foto m2/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Agregar (2)' }));

    // Make the second image the cover explicitly.
    await userEvent.click(screen.getByRole('button', { name: 'Usar como portada (imagen 2)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Crear tipo de habitación' }));

    expect(post).toHaveBeenCalledTimes(1);
    const [path, body] = post.mock.calls[0]!;
    expect(path).toBe('/admin/room-types');
    expect(body).toMatchObject({
      name: 'Suite Jardín',
      images: [
        { mediaAssetId: 'm1', isCover: false },
        { mediaAssetId: 'm2', isCover: true },
      ],
    });
    expect(push).toHaveBeenCalledWith('/admin/room-types/rt-new');
  });
});
