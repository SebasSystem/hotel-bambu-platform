import { describe, expect, it } from 'vitest';
import { evaluateCsrf } from './csrf.js';
import { csrfTokenFor } from './session-token.js';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const ORIGINS = ['http://localhost:3000', 'https://hotelbambuplaza.example'];
const base = {
  method: 'POST',
  origin: 'http://localhost:3000',
  fetchSite: 'same-origin',
  allowedOrigins: ORIGINS,
  sessionId: 'session-1',
  token: csrfTokenFor(SECRET, 'session-1'),
  secret: SECRET,
};

describe('evaluateCsrf', () => {
  it('lets safe methods through without checks', () => {
    expect(
      evaluateCsrf({ ...base, method: 'GET', origin: 'https://evil.example', token: undefined }),
    ).toEqual({
      ok: true,
    });
  });

  it('accepts a same-origin request with the session token', () => {
    expect(evaluateCsrf(base)).toEqual({ ok: true });
  });

  it('rejects an authenticated write without the token', () => {
    expect(evaluateCsrf({ ...base, token: undefined })).toEqual({ ok: false, reason: 'token' });
  });

  it("rejects another session's token", () => {
    expect(evaluateCsrf({ ...base, token: csrfTokenFor(SECRET, 'session-2') })).toEqual({
      ok: false,
      reason: 'token',
    });
  });

  it('rejects cross-site browser requests even with a valid token', () => {
    expect(evaluateCsrf({ ...base, fetchSite: 'cross-site' })).toEqual({
      ok: false,
      reason: 'cross-site',
    });
    expect(evaluateCsrf({ ...base, fetchSite: 'same-site' })).toEqual({
      ok: false,
      reason: 'cross-site',
    });
    expect(evaluateCsrf({ ...base, fetchSite: undefined, origin: 'https://evil.example' })).toEqual(
      {
        ok: false,
        reason: 'origin',
      },
    );
    expect(evaluateCsrf({ ...base, fetchSite: undefined, origin: 'null' })).toEqual({
      ok: false,
      reason: 'origin',
    });
  });

  it('checks the origin of anonymous writes (login CSRF) but needs no token', () => {
    const anonymous = { ...base, sessionId: undefined, token: undefined };
    expect(evaluateCsrf(anonymous)).toEqual({ ok: true });
    expect(
      evaluateCsrf({ ...anonymous, origin: 'https://evil.example', fetchSite: undefined }),
    ).toEqual({
      ok: false,
      reason: 'origin',
    });
  });

  it('allows server-to-server calls without Origin when the token is valid', () => {
    expect(evaluateCsrf({ ...base, origin: undefined, fetchSite: undefined })).toEqual({
      ok: true,
    });
  });
});
