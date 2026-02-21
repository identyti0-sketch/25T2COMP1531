import request from 'sync-request-curl';
import config from '../config.json';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// clear
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('Success case', () => {
  test('clear Success - returns empty object', () => {
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'email@email.com',
        password: 'password123',
        nameFirst: 'firstname',
        nameLast: 'lastname'
      },
      timeout: TIMEOUT_MS
    });
    const userSession = JSON.parse(registerRes.body.toString()).session;

    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        oldPassword: 'password123',
        newPassword: '1newPassword'
      },
      headers: { session: userSession }, // This matches req.get('session')
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });
});

describe('UNAUTHORISED', () => {
  test('Testing: no such user', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        oldPassword: 'password123',
        newPassword: '1newPassword'
      },
      headers: { session: 'invalid-session-123' },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'UNAUTHORISED',
      message: expect.any(String)
    });
  });
});

describe('INVALID_OLD_NEW_PASSWORD', () => {
  let userSession: string;
  beforeEach(() => {
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'email@email.com',
        password: 'password123',
        nameFirst: 'firstname',
        nameLast: 'lastname'
      },
      timeout: TIMEOUT_MS
    });
    userSession = JSON.parse(registerRes.body.toString()).session;
  });

  test('Testing: not the correct old password', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        oldPassword: '11111111',
        newPassword: '1newPassword'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_OLD_PASSWORD',
      message: expect.any(String)
    });
  });

  test('Testing: new old are the same', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        oldPassword: 'password123',
        newPassword: 'password123'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_NEW_PASSWORD',
      message: expect.any(String)
    });
  });
});

describe('INVALID_NEW_PASSWORD', () => {
  let userSession: string;
  beforeEach(() => {
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'email@email.com',
        password: 'password123',
        nameFirst: 'firstname',
        nameLast: 'lastname'
      },
      timeout: TIMEOUT_MS
    });
    userSession = JSON.parse(registerRes.body.toString()).session;
  });

  test('Testing: new pw too short', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        oldPassword: 'password123',
        newPassword: '1'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_NEW_PASSWORD',
      message: expect.any(String)
    });
  });

  test('Testing: does have letter / number', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        oldPassword: 'password123',
        newPassword: 'letteronly'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_NEW_PASSWORD',
      message: expect.any(String)
    });
  });

  test('Testing: does have letter / number', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      json: {
        oldPassword: 'password123',
        newPassword: '111100000'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_NEW_PASSWORD',
      message: expect.any(String)
    });
  });
});
