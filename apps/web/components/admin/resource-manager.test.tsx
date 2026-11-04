// @vitest-environment jsdom
import { faqCreateSchema, faqUpdateSchema } from '@hotel-bambu/shared';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import type { Faq } from '@/lib/api/types';
import { FeedbackProvider } from './feedback';
import { ResourceManager } from './resource-manager';

const post = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock('@/lib/api/browser', () => ({
  browserApi: {
    post: (...args: unknown[]) => post(...args),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderManager() {
  return render(
    <FeedbackProvider>
      <ResourceManager<Faq>
        endpoint="/admin/faq"
        items={[]}
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

describe('ResourceManager form', () => {
  afterEach(() => {
    cleanup();
    post.mockReset();
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
    await user.type(screen.getByLabelText(/^Pregunta/), '¿Tienen parqueadero?');
    await user.type(screen.getByLabelText(/^Respuesta/), 'Sí');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

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
  });

  it('validates required fields in Spanish before calling the API', async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole('button', { name: /Agregar pregunta/ }));
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(2);
    expect(post).not.toHaveBeenCalled();
  });
});
