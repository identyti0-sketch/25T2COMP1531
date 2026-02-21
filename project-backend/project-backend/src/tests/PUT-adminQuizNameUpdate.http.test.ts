import request from 'sync-request-curl';
import config from '../config.json';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// clear
beforeEach(() => {
  // Clear data
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('adminQuizNameUpdate', () => {
  test('Successful quiz name update', () => {
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
        name: 'ValidQuizName',
        description: 'ValidDescription'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      json: { name: 'NewQuizName' },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body.toString())).toEqual({});
  });

  test('Error when name is empty', () => {
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
        description: 'AnotherValidDescription'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      json: { name: '' },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('UNAUTHORISED', () => {
  test('Testing: Not a valid user', () => {
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
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      json: { name: 'newQuizName' },
      headers: { session: 'randomInvalidSession' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'UNAUTHORISED',
      message: expect.any(String)
    });
  });
});

describe('INVALID_QUIZ_ID', () => {
  test('Testing: No such quizId', () => {
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
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId + 10}/name`, {
      json: { name: 'newQuizName' },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_QUIZ_ID',
      message: expect.any(String)
    });
  });
});

describe('INVALID_QUIZ_ID', () => {
  test('not the correct owner', () => {
    // Register first user and create quiz
    const registerRes1 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test1@example.com',
        password: 'password123',
        nameFirst: 'Testone',
        nameLast: 'Userone'
      }
    });
    const user1 = JSON.parse(registerRes1.body.toString());
    const userSession1 = user1.session;

    // Create quiz with first user
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Valid Quiz Name',
        description: 'Valid description'
      },
      headers: { session: userSession1 }
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    // Register second user
    const registerRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test2@example.com',
        password: 'password456',
        nameFirst: 'Testtwo',
        nameLast: 'Usertwo'
      }
    });
    const user2 = JSON.parse(registerRes2.body.toString());
    const userSession2 = user2.session;

    // Second user tries to rename first user's quiz
    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      json: { name: 'newCreatedTest' },
      headers: { session: userSession2 }
    });

    // Verify response
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_QUIZ_ID',
      message: expect.any(String)
    });
  });
});

describe('INVALID_QUIZ_NAME', () => {
  test('Testing: Invalid characters', () => {
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
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      json: { name: 'Invalid!!!' },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_QUIZ_NAME',
      message: expect.any(String)
    });
  });

  test('Testing: Name length too long', () => {
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
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      json: { name: 'NewQuizNewQuizNewQuizNewQuizNewQuiz' },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'INVALID_QUIZ_NAME',
      message: expect.any(String)
    });
  });
});

describe('DUPLICATE_QUIZ_NAME', () => {
  test('Testing: Duplicataed Quiz Name', () => {
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
        name: 'A Valid Quiz Name1',
        description: 'AnotherValidDescription'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'A Valid Quiz Name',
        description: 'AnotherValidDescription'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      json: { name: 'A Valid Quiz Name' },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: 'DUPLICATE_QUIZ_NAME',
      message: expect.any(String)
    });
  });
});
