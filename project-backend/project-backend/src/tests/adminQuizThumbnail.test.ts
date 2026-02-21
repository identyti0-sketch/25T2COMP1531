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

describe('Tests for PUT-adminQuizDescriptionUpdate HTTP', () => {
  describe('Error Cases', () => {
    test('Invalid User', () => {
      // Register user
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

      // Create quiz
      const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
        json: {
          name: 'AnotherValidQuizName',
          description: 'AnptherValidDescription'
        },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      const quizid = JSON.parse(quizRes.body.toString()).quizId;

      const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/thumbnail`, {
        json: { thumbnailUrl: 'http://google.com/some/image/path.jpg' },
        headers: { session: 'randomInvalidSession' },
        timeout: TIMEOUT_MS
      });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'UNAUTHORISED',
        message: expect.any(String)
      });
    });

    test('Invalid Quiz', () => {
      // Register user
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

      const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
        json: {
          name: 'AnotherValidQuizName',
          description: 'AnotherValidDescription'
        },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      const quizid = JSON.parse(quizRes.body.toString()).quizId;

      const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid + 10}/thumbnail`, {
        json: { thumbnailUrl: 'http://google.com/some/image/path.jpg' },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String)
      });
    });

    test('Quiz Owned By Another User', () => {
      // Register user
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

      const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
        json: {
          name: 'AnotherValidQuizName',
          description: 'AnotherValidDescription'
        },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      const quizid = JSON.parse(quizRes.body.toString()).quizId;

      // create another user
      const anotherRegisterRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
        json: {
          email: 'exampleemail@email.com',
          password: 'password222',
          nameFirst: 'firstnamee',
          nameLast: 'lastnamee'
        },
        timeout: TIMEOUT_MS
      });
      const anotherRegisterSession = JSON.parse(anotherRegisterRes.body.toString()).session;
      const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/thumbnail`, {
        json: { thumbnailUrl: 'http://google.com/some/image/path.jpg' },
        headers: { session: anotherRegisterSession },
        timeout: TIMEOUT_MS
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String)
      });
    });

    test('Invalid Thumbnail--no end', () => {
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

      const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
        json: {
          name: 'AnotherValidQuizName',
          description: 'AnotherValidDescription'
        },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      const quizid = JSON.parse(quizRes.body.toString()).quizId;

      // create a long description
      // const longDescription = 'new description'.repeat(10);

      const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/thumbnail`, {
        json: { thumbnailUrl: 'http://google.com/some/image/path.balls' },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'INVALID_THUMBNAIL',
        message: expect.any(String)
      });
    });
  });

  describe('Success Cases', () => {
    test('Valid Input', () => {
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

      const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
        json: {
          name: 'AnotherValidQuizName',
          description: 'AnotherValidDescription'
        },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      const quizid = JSON.parse(quizRes.body.toString()).quizId;

      const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/thumbnail`, {
        json: { thumbnailUrl: 'http://google.com/some/image/path.jpg' },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body.toString())).toStrictEqual({ });
    });

    test('No Description', () => {
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

      const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
        json: {
          name: 'AnotherValidQuizName',
          description: 'AnotherValidDescription'
        },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      const quizid = JSON.parse(quizRes.body.toString()).quizId;

      const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/thumbnail`, {
        json: { thumbnailUrl: '' },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      });
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(
        {
          error: 'INVALID_THUMBNAIL',
          message: expect.any(String)
        }
      );
    });
  });
});
