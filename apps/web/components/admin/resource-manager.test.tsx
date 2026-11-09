// @vitest-environment jsdom
import { faqCreateSchema, faqUpdateSchema } from '@hotel-bambu/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import type { Faq } from '@/lib/api/types';
import { FeedbackProvider } from './feedback';
import { ResourceManager } from './resource-manager';

const post = vi.fn();
const patch = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock('@/lib/api/browser', () => ({
  browserApi: {
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const faq = {
  id: '0190a0c0-0000-7000-8000-0000000000f1',
  question: '¿Hay piscina?',
  answer: 'Sí, al aire libre.',
} as Faq;

function renderManager(items: Faq[] = []) {
  return render(
    <FeedbackProvider>
      <ResourceManager<Faq>
        endpoint="/admin/faq"
        items={items}
        noun="pregunta"
        createSchema={faqCreateSchema}
        updateSchema={faqUpdateSchema}
        fields={[
          { name: 'question', label: 'Pregunta', kind: 'text', required: true },
          { name: 'answer', label: 'Respuesta', kind: 'textarea', required: true },
        ]}
        emptyValues={{ question: '', answer: '' }}
        toFormValues={(item) => ({ question: item.question, answer: item.answer })}
        itemLabel={(item) => item.question}
        renderSummary={(item) => item.question}
      />
    </FeedbackProvider>,
  );
}

// jsdom has no HTMLDialogElement.showModal/close.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
});

describe('ResourceManager form', () => {
  afterEach(() => {
    cleanup();
    post.mockReset();
    patch.mockReset();
    refresh.mockReset();
  });

  it('maps API validation details to the matching field', async () => {
    post.mockRejectedValue(
      new ApiError(400, {
        message: 'Validation failed',
        details: [{ path: 'answer', message: 'Too small', code: 'too_big' }],
      }),
    );
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: /Agregar pregunta/ }));
    const dialog = screen.getByRole('dialog', { name: 'Agregar pregunta' });
    await user.type(within(dialog).getByLabelText(/^Pregunta/), '¿Tienen parqueadero?');
    await user.type(within(dialog).getByLabelText(/^Respuesta/), 'Sí');
    await user.click(within(dialog).getByRole('button', { name: 'Agregar' }));

    const answer = screen.getByLabelText(/^Respuesta/);
    expect(await screen.findByText('El valor es demasiado largo o grande.')).toBeTruthy();
    expect(answer.getAttribute('aria-invalid')).toBe('true');
    expect(post).toHaveBeenCalledWith('/admin/faq', {
      question: '¿Tienen parqueadero?',
      answer: 'Sí',
      published: false,
      showOnHome: false,
    });
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Agregar pregunta' })).toBeTruthy();
  });

  it('validates required fields in Spanish before calling the API', async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole('button', { name: /Agregar pregunta/ }));
    const dialog = screen.getByRole('dialog', { name: 'Agregar pregunta' });
    await user.click(within(dialog).getByRole('button', { name: 'Agregar' }));
    expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(2);
    expect(post).not.toHaveBeenCalled();
  });

  it('edits an item in a modal, then closes it with a toast and returns focus', async () => {
    patch.mockResolvedValue(faq);
    const user = userEvent.setup();
    renderManager([faq]);

    const edit = screen.getByRole('button', { name: 'Editar ¿Hay piscina?' });
    await user.click(edit);
    const dialog = screen.getByRole('dialog', { name: 'Editar pregunta' });
    expect(within(dialog).getByText('¿Hay piscina?')).toBeTruthy();
    // The row stays in the list; the form opens on top of it.
    expect(screen.getByRole('listitem')).toBeTruthy();
    const answer = within(dialog).getByLabelText(/^Respuesta/);
    await user.clear(answer);
    await user.type(answer, 'Sí, climatizada.');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

    expect(patch).toHaveBeenCalledWith(
      `/admin/faq/${faq.id}`,
      expect.objectContaining({ question: '¿Hay piscina?', answer: 'Sí, climatizada.' }),
    );
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Editar pregunta' })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Cambios guardados.');
    expect(document.activeElement).toBe(edit);
  });
});
