
import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ERROR } from './testHelper';
import { SessionId } from '../interface';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('POST /v1/admin/auth/login, single user', () => {
  beforeEach(() => {
    request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu753@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      });
  });
  test.each([
    {
      description: 'Testing: Email doesn\'t exists',
      email: 'samuel.mu@gmail.com',
      password: 'abcd1234',
      output: ERROR('INVALID_CREDENTIALS')
    },
    {
      description: 'Testing: Password is incorrect',
      email: 'samuel.mu753@gmail.com',
      password: 'abcdabcd1234',
      output: ERROR('INVALID_CREDENTIALS')
    }
  ])('$description',
    ({ email, password, output }) => {
      const res = request('POST', SERVER_URL + '/v1/admin/auth/login',
        { json: { email, password }, timeout: TIMEOUT_MS });
      expect(JSON.parse(res.body.toString())).toStrictEqual(output);
      expect(res.statusCode).toStrictEqual(400);
    });

  test('has the correct return type and works', () => {
    const res = request('POST', SERVER_URL + '/v1/admin/auth/login',
      { json: { email: 'samuel.mu753@gmail.com', password: 'abcd1234' }, timeout: TIMEOUT_MS });
    expect(JSON.parse(res.body.toString()) as SessionId).toStrictEqual({
      session: expect.any(String)
    });
  });
});

describe('POST /v1/admin/auth/login, multiple user', () => {
  beforeEach(() => {
    request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu2753@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      });
    request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu753@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      });
    request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu7543@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      });
  });
  test.each([
    {
      description: 'Testing: Email doesn\'t exists',
      email: 'samuel.mu@gmail.com',
      password: 'abcd1234',
      output: ERROR('INVALID_CREDENTIALS')
    },
    {
      description: 'Testing: Password is incorrect',
      email: 'samuel.mu753@gmail.com',
      password: 'abcdabcd1234',
      output: ERROR('INVALID_CREDENTIALS')
    }
  ])('$description',
    ({ email, password, output }) => {
      const res = request('POST', SERVER_URL + '/v1/admin/auth/login',
        { json: { email, password }, timeout: TIMEOUT_MS });
      expect(JSON.parse(res.body.toString())).toStrictEqual(output);
      expect(res.statusCode).toStrictEqual(400);
    });

  test('has the correct return type and works', () => {
    const res1 = request('POST', SERVER_URL + '/v1/admin/auth/login',
      { json: { email: 'samuel.mu753@gmail.com', password: 'abcd1234' }, timeout: TIMEOUT_MS });
    const res2 = request('POST', SERVER_URL + '/v1/admin/auth/login',
      { json: { email: 'samuel.mu753@gmail.com', password: 'abcd1234' }, timeout: TIMEOUT_MS });
    expect(JSON.parse(res1.body.toString()) as SessionId).toStrictEqual({
      session: expect.any(String)
    });
    expect(JSON.parse(res2.body.toString()) as SessionId).toStrictEqual({
      session: expect.any(String)
    });
  });
});
