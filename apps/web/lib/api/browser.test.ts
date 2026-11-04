import { describe, expect, it } from 'vitest';
import { loginUrl, readCookie } from './browser';

describe('browser helpers', () => {
  it('reads a cookie value by name', () => {
    expect(readCookie('hb_csrf', 'a=1; hb_csrf=tok%3D1; b=2')).toBe('tok=1');
    expect(readCookie('missing', 'a=1')).toBeNull();
  });

  it('only keeps admin paths as the post-login destination', () => {
    expect(loginUrl('/admin/rooms')).toBe('/admin/login?next=%2Fadmin%2Frooms');
    expect(loginUrl('https://evil.example')).toBe('/admin/login');
    expect(loginUrl('/admin/login')).toBe('/admin/login');
  });
});
