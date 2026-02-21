import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ERROR, rqstBody, rqstHead } from './testHelper';
import { SessionId } from '../interface';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('POST /v1/admin/auth/logout, single user', () => {
  let id1: string;
  beforeEach(() => {
    id1 = rqstBody('POST', '/v1/admin/auth/register',
      {
        email: 'samuel.mu753@gmail.com',
        password: 'abcd1234',
        nameFirst: 'Samuel',
        nameLast: 'Mu'
      }).body.session;
  });
  test('Success Case', () => {
    const res = rqstHead('GET', '/v1/admin/user/details', { session: id1 });
    expect(res.body).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Samuel Mu',
        email: 'samuel.mu753@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Invalid session Id', () => {
    const res = rqstHead('GET', '/v1/admin/user/details', { session: id1 + 1 });
    expect(res.body).toStrictEqual(ERROR('UNAUTHORISED'));
    expect(res.statusCode).toStrictEqual(401);
  });
});

describe('POST /v1/admin/auth/logout, multiple user', () => {
  let id1: string;
  beforeEach(() => {
    rqstBody('POST', '/v1/admin/auth/register',
      {
        email: 'samuel.mu7523@gmail.com',
        password: 'abcd1234',
        nameFirst: 'Samuel',
        nameLast: 'Mu'
      });
    id1 = (rqstBody('POST', '/v1/admin/auth/register',
      {
        email: 'samuel.mu753@gmail.com',
        password: 'abcd1234',
        nameFirst: 'Samuel',
        nameLast: 'Mu'
      }).body as SessionId).session;
    rqstBody('POST', '/v1/admin/auth/register',
      {
        email: 'samuel.mu75223@gmail.com',
        password: 'abcd1234',
        nameFirst: 'Samuel',
        nameLast: 'Mu'
      });
  });
  test('Success Case', () => {
    const res = rqstHead('GET', '/v1/admin/user/details', { session: id1 });
    expect(res.body).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Samuel Mu',
        email: 'samuel.mu753@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Invalid session Id', () => {
    const res = rqstHead('GET', '/v1/admin/user/details', { session: id1 + 1 });
    expect(res.body).toStrictEqual(ERROR('UNAUTHORISED'));
    expect(res.statusCode).toStrictEqual(401);
  });
});
