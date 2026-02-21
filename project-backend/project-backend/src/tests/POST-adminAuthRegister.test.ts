import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ERROR } from './testHelper';
import { SessionId } from '../interface';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});
describe('POST /v1/admin/auth/register', () => {
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
      description: 'Testing: Email already exists',
      email: 'samuel.mu753@gmail.com',
      password: 'abcd1234',
      nameFirst: 'Samuel',
      nameLast: 'Mu',
      output: ERROR('INVALID_EMAIL')
    },
    {
      description: 'Testing: Email syntax is bad',
      email: 'samuel.mucom',
      password: 'abcd1234',
      nameFirst: 'Samuel',
      nameLast: 'Mu',
      output: ERROR('INVALID_EMAIL')
    },
    {
      description: 'Testing: First name contains invalid characters',
      email: 'samuel.mu743@gmail.com',
      password: 'abcd1234',
      nameFirst: 'Samuel\\',
      nameLast: 'Mu',
      output: ERROR('INVALID_FIRST_NAME')
    },
    {
      description: 'Testing: First name is too short',
      email: 'samuel.mu7453@gmail.com',
      password: 'abcd1234',
      nameFirst: 'S',
      nameLast: 'Mu',
      output: ERROR('INVALID_FIRST_NAME')
    },
    {
      description: 'Testing: Password too short',
      email: 'samuel.mu7453@gmail.com',
      password: 'abcd1234',
      nameFirst: 'Samuel',
      nameLast: 'Mu@',
      output: ERROR('INVALID_LAST_NAME')
    },
    {
      description: 'Testing: Last name is too long',
      email: 'samuel.mu7543@gmail.com',
      password: 'abcd1234',
      nameFirst: 'Samuel',
      nameLast: 'Moooooooooooooooooooooooooooooooooooooooooooo',
      output: ERROR('INVALID_LAST_NAME')
    },
    {
      description: 'Testing: Password too short',
      email: 'samuel.mu7453@gmail.com',
      password: 'abd1234',
      nameFirst: 'Samuel',
      nameLast: 'Mu',
      output: ERROR('INVALID_PASSWORD')
    },
    {
      description: "Testing: Password isn't secure enough",
      email: 'samuel.mu7453@gmail.com',
      password: 'abcdabcd',
      nameFirst: 'Samuel',
      nameLast: 'Mu',
      output: ERROR('INVALID_PASSWORD')
    },
  ])('$description',
    ({ email, password, nameFirst, nameLast, output }) => {
      const res = request('POST', SERVER_URL + '/v1/admin/auth/register',
        { json: { email, password, nameFirst, nameLast }, timeout: TIMEOUT_MS });
      expect(JSON.parse(res.body.toString())).toStrictEqual(output);
      expect(res.statusCode).toStrictEqual(400);
    });

  test('has the correct return type', () => {
    const res = request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu7453@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      });
    expect(JSON.parse(res.body.toString()) as SessionId).toStrictEqual({
      session: expect.any(String)
    });
  });

  test('adds user properly', () => {
    const res = request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu7453@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      });
    const session = (JSON.parse(res.body.toString()) as SessionId).session;
    const listRes = request('GET', SERVER_URL + '/v1/admin/user/details',
      { headers: { session: session }, timeout: TIMEOUT_MS });
    expect(JSON.parse(listRes.body.toString())).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Samuel Mu',
        email: 'samuel.mu7453@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
  });
});
