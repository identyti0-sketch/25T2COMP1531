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
    id1 = (JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu753@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      }).body.toString()) as SessionId).session;
  });
  test('Success Case + invalid ID', () => {
    const res = request('POST', SERVER_URL + '/v1/admin/auth/logout',
      { headers: { session: id1 }, timeout: TIMEOUT_MS });
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
    expect(res.statusCode).toStrictEqual(200);
    const res2 = request('POST', SERVER_URL + '/v1/admin/auth/logout',
      { headers: { session: id1 }, timeout: TIMEOUT_MS });
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR('UNAUTHORISED'));
    expect(res2.statusCode).toStrictEqual(401);
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
  test('Success Case + invalid ID', () => {
    const id2: string = rqstBody('POST', '/v1/admin/auth/login',
      { email: 'samuel.mu753@gmail.com', password: 'abcd1234' }).body.session;
    const logout1 = rqstHead('POST', '/v1/admin/auth/logout', { session: id1 });
    expect(logout1.body).toStrictEqual({});
    expect(logout1.statusCode).toStrictEqual(200);
    const logout12 = rqstHead('POST', '/v1/admin/auth/logout', { session: id1 });
    expect(logout12.body).toStrictEqual(ERROR('UNAUTHORISED'));
    expect(logout12.statusCode).toStrictEqual(401);
    const logout2 = rqstHead('POST', '/v1/admin/auth/logout', { session: id2 });
    expect(logout2.body).toStrictEqual({});
    expect(logout2.statusCode).toStrictEqual(200);
    const logout22 = rqstHead('POST', '/v1/admin/auth/logout', { session: id2 });
    expect(logout22.body).toStrictEqual(ERROR('UNAUTHORISED'));
    expect(logout22.statusCode).toStrictEqual(401);
  });
});
