// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { MediaAsset } from '@/lib/api/types';
import { FeedbackProvider } from './feedback';
import { MediaField, MediaPicker } from './media-picker';

const get = vi.fn();
const post = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock('./admin-context', () => ({ useThumbnail: () => null }));
vi.mock('@/lib/api/browser', () => ({
  browserApi: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const asset = (id: string, altText = `Foto ${id}`): MediaAsset =>
  ({
    id,
    status: 'READY',
    altText,
    variants: [],
    width: 1920,
    height: 1080,
  }) as unknown as MediaAsset;

const page = (items: MediaAsset[]) => ({ items, total: items.length, page: 1, pageSize: 48 });
const image = (name: string) => new File([new Uint8Array(10)], name, { type: 'image/jpeg' });

beforeAll(() => {
  // jsdom has no modal dialog support.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
});

function renderPicker(props: Partial<Parameters<typeof MediaPicker>[0]> = {}) {
  const onSelect = vi.fn();
  render(
    <FeedbackProvider>
      <MediaPicker open onClose={vi.fn()} onSelect={onSelect} {...props} />
    </FeedbackProvider>,
  );
  return { onSelect };
}

const uploadTab = () => screen.getByRole('tab', { name: 'Subir archivos' });
const libraryTab = () => screen.getByRole('tab', { name: 'Elegir de la galería' });

describe('MediaPicker upload tab', () => {
  afterEach(() => {
    cleanup();
    get.mockReset();
    post.mockReset();
  });

  it('opens on "Subir archivos" when the library is empty', async () => {
    get.mockResolvedValue(page([]));
    renderPicker();
    await waitFor(() => expect(uploadTab().getAttribute('aria-selected')).toBe('true'));
    expect(libraryTab().getAttribute('aria-selected')).toBe('false');
    expect(screen.getByLabelText(/Archivos/)).toBeTruthy();
  });

  it('opens on the gallery when it has images, and the upload tab is one click away', async () => {
    get.mockResolvedValue(page([asset('a')]));
    renderPicker();
    await screen.findByText('Foto a');
    expect(libraryTab().getAttribute('aria-selected')).toBe('true');
    await userEvent.click(uploadTab());
    expect(uploadTab().getAttribute('aria-selected')).toBe('true');
  });

  it('requires the alt text of every file before uploading', async () => {
    get.mockResolvedValue(page([]));
    renderPicker();
    await waitFor(() => expect(uploadTab().getAttribute('aria-selected')).toBe('true'));
    await userEvent.upload(screen.getByLabelText(/Archivos/), image('cama.jpg'));
    await userEvent.click(screen.getByRole('button', { name: /Subir 1 imagen/ }));
    expect(await screen.findByText('Escriba el texto alternativo.')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects files with a format the API does not accept', async () => {
    get.mockResolvedValue(page([]));
    renderPicker();
    await waitFor(() => expect(uploadTab().getAttribute('aria-selected')).toBe('true'));
    await userEvent.upload(
      screen.getByLabelText(/Archivos/),
      new File(['x'], 'plano.gif', { type: 'image/gif' }),
      { applyAccept: false },
    );
    expect(
      await screen.findByText('plano.gif: formato no permitido. Use JPG, PNG o WebP.'),
    ).toBeTruthy();
  });

  it('single mode: the uploaded image is selected right away', async () => {
    get.mockResolvedValue(page([]));
    post.mockResolvedValue(asset('new', 'Fachada del hotel'));
    const { onSelect } = renderPicker();
    await waitFor(() => expect(uploadTab().getAttribute('aria-selected')).toBe('true'));
    await userEvent.upload(screen.getByLabelText(/Archivos/), image('fachada.jpg'));
    await userEvent.type(
      screen.getByLabelText(/Texto alternativo de fachada.jpg/),
      'Fachada del hotel',
    );
    await userEvent.click(screen.getByRole('button', { name: /Subir 1 imagen/ }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith([asset('new', 'Fachada del hotel')]));
    const body = post.mock.calls[0]![1] as FormData;
    expect(body.get('altText')).toBe('Fachada del hotel');
  });

  it('multiple mode: every uploaded image is selected and added together', async () => {
    get.mockResolvedValue(page([]));
    post.mockResolvedValueOnce(asset('one')).mockResolvedValueOnce(asset('two'));
    const { onSelect } = renderPicker({ multiple: true });
    await waitFor(() => expect(uploadTab().getAttribute('aria-selected')).toBe('true'));
    await userEvent.upload(screen.getByLabelText(/Archivos/), [image('a.jpg'), image('b.jpg')]);
    await userEvent.type(screen.getByLabelText(/Texto alternativo de a.jpg/), 'Foto one');
    await userEvent.type(screen.getByLabelText(/Texto alternativo de b.jpg/), 'Foto two');
    await userEvent.click(screen.getByRole('button', { name: /Subir 2 imágenes/ }));
    const add = await screen.findByRole('button', { name: 'Agregar (2)' });
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.click(add);
    expect(onSelect).toHaveBeenCalledWith([asset('one'), asset('two')]);
  });

  it('single mode keeps only one file in the queue', async () => {
    get.mockResolvedValue(page([]));
    renderPicker();
    await waitFor(() => expect(uploadTab().getAttribute('aria-selected')).toBe('true'));
    const input = screen.getByLabelText(/Archivos/) as HTMLInputElement;
    expect(input.multiple).toBe(false);
    await userEvent.upload(input, image('a.jpg'));
    await userEvent.upload(input, image('b.jpg'));
    expect(screen.queryByLabelText(/Texto alternativo de a.jpg/)).toBeNull();
    expect(screen.getByLabelText(/Texto alternativo de b.jpg/)).toBeTruthy();
  });
});

describe('MediaField', () => {
  afterEach(() => {
    cleanup();
    get.mockReset();
  });

  it('offers "Subir imagen" and "Elegir de la galería" when empty', async () => {
    get.mockResolvedValue(page([asset('a')]));
    render(
      <FeedbackProvider>
        <MediaField label="Logo" value={null} onChange={vi.fn()} />
      </FeedbackProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Subir imagen para logo' }));
    expect(uploadTab().getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('button', { name: 'Elegir de la galería: logo' })).toBeTruthy();
  });

  it('shows the preview with replace and remove, plus image warnings', async () => {
    const onChange = vi.fn();
    render(
      <FeedbackProvider>
        <MediaField
          label="Imagen"
          value="m1"
          preview={{ variants: [], altText: 'Patio', width: 960, height: 1280 }}
          warnings={(media) => (media.width && media.width < 1920 ? ['Foto pequeña'] : [])}
          onChange={onChange}
        />
      </FeedbackProvider>,
    );
    expect(screen.getByText('Foto pequeña')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reemplazar imagen' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar imagen' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
