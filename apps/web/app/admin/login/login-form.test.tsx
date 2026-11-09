// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { LoginForm } from './login-form';

const post = vi.fn();
const setCsrfToken = vi.fn();

vi.mock('@/lib/api/browser', () => ({
  anonymousBrowserApi: { post: (...args: unknown[]) => post(...args) },
  setCsrfToken: (token: string) => setCsrfToken(token),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    post.mockReset();
    setCsrfToken.mockReset();
  });
  afterEach(cleanup);

  it('shows Spanish field errors linked with aria-describedby and does not call the API', async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/admin" onAuthenticated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    const email = await screen.findByLabelText(/Correo electrónico/);
    expect(email).toHaveProperty('ariaInvalid', 'true');
    const describedBy = email.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe(
      'Ingrese un correo electrónico válido.',
    );
    expect(screen.getByText('Este campo es obligatorio.')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it('lets the user show and hide the password', async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/admin" onAuthenticated={vi.fn()} />);

    const password = screen.getByLabelText(/Contraseña/);
    expect(password.getAttribute('type')).toBe('password');

    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await user.click(toggle);
    expect(password.getAttribute('type')).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Ocultar contraseña');

    await user.click(toggle);
    expect(password.getAttribute('type')).toBe('password');
  });

  it('shows a generic message on 401 and focuses the password', async () => {
    post.mockRejectedValue(new ApiError(401, { message: 'Invalid email or password.' }));
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    render(<LoginForm next="/admin" onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText(/Correo electrónico/), 'Admin@Example.test');
    await user.type(screen.getByLabelText(/^Contraseña/), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Correo o contraseña incorrectos.');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText(/^Contraseña/)));
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@example.test',
      password: 'wrong-password',
    });
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('stores the CSRF token and continues to the requested page on success', async () => {
    post.mockResolvedValue({ user: {}, csrfToken: 'tok', expiresAt: '' });
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    render(<LoginForm next="/admin/rooms" onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText(/Correo electrónico/), 'admin@example.test');
    await user.type(screen.getByLabelText(/^Contraseña/), 'Bambu-local-dev-2026!');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('/admin/rooms'));
    expect(setCsrfToken).toHaveBeenCalledWith('tok');
  });
});
