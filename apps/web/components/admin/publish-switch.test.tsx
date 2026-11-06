// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { describeApiError } from '@/lib/forms/form-errors';
import { FeedbackProvider } from './feedback';
import { PublishSwitch } from './publish-switch';

const patch = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock('@/lib/api/browser', () => ({
  browserApi: {
    post: vi.fn(),
    patch: (...args: unknown[]) => patch(...args),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderSwitch(status: 'PUBLISHED' | 'DRAFT' | 'INACTIVE' = 'DRAFT') {
  return render(
    <FeedbackProvider>
      <PublishSwitch endpoint="/admin/room-types/rt1/status" name="Pareja" status={status} />
    </FeedbackProvider>,
  );
}

const control = () => screen.getByRole('switch', { name: 'Publicar Pareja' });

describe('PublishSwitch', () => {
  afterEach(() => {
    cleanup();
    patch.mockReset();
    refresh.mockReset();
  });

  it('reflects the status: only PUBLISHED is on', () => {
    renderSwitch('PUBLISHED');
    expect(control().getAttribute('aria-checked')).toBe('true');
    cleanup();
    renderSwitch('INACTIVE');
    expect(control().getAttribute('aria-checked')).toBe('false');
  });

  it('turns on optimistically, PATCHes the status and refreshes the page data', async () => {
    const request = deferred();
    patch.mockReturnValue(request.promise);
    const user = userEvent.setup();
    renderSwitch('DRAFT');

    await user.click(control());

    expect(patch).toHaveBeenCalledWith('/admin/room-types/rt1/status', { status: 'PUBLISHED' });
    expect(control().getAttribute('aria-checked')).toBe('true');
    expect(control().getAttribute('aria-busy')).toBe('true');

    await act(async () => request.resolve({}));

    expect(control().getAttribute('aria-checked')).toBe('true');
    expect(control().getAttribute('aria-busy')).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain('«Pareja» publicado.');
  });

  it('unpublishes to DRAFT', async () => {
    patch.mockResolvedValue({});
    const user = userEvent.setup();
    renderSwitch('PUBLISHED');
    await user.click(control());
    expect(patch).toHaveBeenCalledWith('/admin/room-types/rt1/status', { status: 'DRAFT' });
    expect(control().getAttribute('aria-checked')).toBe('false');
  });

  it('reverts and explains the error when the API refuses', async () => {
    const request = deferred();
    patch.mockReturnValue(request.promise);
    const user = userEvent.setup();
    renderSwitch('DRAFT');

    await user.click(control());
    expect(control().getAttribute('aria-checked')).toBe('true');

    const error = new ApiError(422, { message: 'Room type is not ready to publish' });
    await act(async () => request.reject(error));

    expect(control().getAttribute('aria-checked')).toBe('false');
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain(describeApiError(error));
  });
});
