// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FeedbackProvider } from './feedback';
import { FormModal } from './form-modal';

// jsdom has no HTMLDialogElement.showModal/close.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
});

function Harness({
  dirty = false,
  onSubmit,
  onClose,
}: {
  dirty?: boolean;
  onSubmit?: () => void;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <FeedbackProvider>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <FormModal
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        title="Agregar pregunta"
        description="Se mostrará en el sitio."
        dirty={dirty}
        submitLabel="Agregar"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <label>
          Pregunta
          <input name="question" />
        </label>
      </FormModal>
    </FeedbackProvider>
  );
}

async function openModal(props: Parameters<typeof Harness>[0] = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  await user.click(screen.getByRole('button', { name: 'Abrir' }));
  return { user, dialog: screen.getByRole('dialog', { name: 'Agregar pregunta' }) };
}

describe('FormModal', () => {
  afterEach(() => cleanup());

  it('opens as a labelled dialog with its description and focuses the first field', async () => {
    const { dialog } = await openModal();
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    expect(
      document.getElementById(dialog.getAttribute('aria-describedby') ?? '')?.textContent,
    ).toBe('Se mostrará en el sitio.');
    expect(document.activeElement).toBe(within(dialog).getByLabelText('Pregunta'));
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('closes with Esc (cancel event) and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    const { dialog } = await openModal({ onClose });
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Agregar pregunta' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir' }));
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('closes with the X button and with Cancelar', async () => {
    const onClose = vi.fn();
    const { user, dialog } = await openModal({ onClose });
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Agregar pregunta' })).getByRole('button', {
        name: 'Cancelar',
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes on a backdrop click but not on a click inside the content', async () => {
    const onClose = vi.fn();
    const { user, dialog } = await openModal({ onClose });
    await user.click(within(dialog).getByLabelText('Pregunta'));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks before discarding unsaved changes', async () => {
    const onClose = vi.fn();
    const { user, dialog } = await openModal({ dirty: true, onClose });

    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
    const ask = await screen.findByRole('dialog', { name: '¿Descartar cambios?' });
    await user.click(within(ask).getByRole('button', { name: 'Seguir editando' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Agregar pregunta' })).toBeTruthy();

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    const again = await screen.findByRole('dialog', { name: '¿Descartar cambios?' });
    await user.click(within(again).getByRole('button', { name: 'Descartar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits the form from the footer button', async () => {
    const onSubmit = vi.fn();
    const { user, dialog } = await openModal({ onSubmit });
    expect(within(dialog).getByRole('form', { name: 'Agregar pregunta' })).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Agregar' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
