import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { SessionId, QuizId } from '../interface';
import {
  clearHelper,
  authRegisterHelper,
  quizCreateHelper,
  rqstHead
} from './testHelper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clearHelper();
});

describe('GET /v1/admin/quiz/list - Success cases', () => {
  let session1: string;
  let session2: string;

  beforeEach(() => {
    // Create two users before each test
    const registerRes1 = authRegisterHelper('user1@example.com', 'password123', 'User', 'One');
    session1 = (registerRes1 as SessionId).session;

    const registerRes2 = authRegisterHelper('user2@example.com', 'password123', 'User', 'Two');
    session2 = (registerRes2 as SessionId).session;
  });

  test('user with no quizzes returns empty list', () => {
    const res = rqstHead('GET', '/v1/admin/quiz/list', { session: session1 });
    expect(res.body).toStrictEqual({ quizzes: [] });
    expect(res.statusCode).toStrictEqual(200);
  });

  test('returns only quizzes owned by user', () => {
    // Create quizzes for user1
    const quizARes = quizCreateHelper(session1, 'Quiz A', 'Description');
    const quizAId = (quizARes as QuizId).quizId;

    const quizBRes = quizCreateHelper(session1, 'Quiz B', 'Description');
    const quizBId = (quizBRes as QuizId).quizId;

    // Create quiz for user2
    quizCreateHelper(session2, 'Quiz C', 'Description');

    // Check user1 only sees their quizzes
    const res = rqstHead('GET', '/v1/admin/quiz/list', { session: session1 });

    expect(res.body).toStrictEqual({
      quizzes: [
        { quizId: quizAId, name: 'Quiz A' },
        { quizId: quizBId, name: 'Quiz B' },
      ],
    });
    expect(res.statusCode).toStrictEqual(200);
  });

  test('quiz list maintains creation order', () => {
    // Create multiple quizzes for session1
    const quiz1Res = quizCreateHelper(session1, 'First Quiz', 'Test description');
    const quiz1Id = (quiz1Res as QuizId).quizId;

    const quiz2Res = quizCreateHelper(session1, 'Second Quiz', 'Test description');
    const quiz2Id = (quiz2Res as QuizId).quizId;

    const quiz3Res = quizCreateHelper(session1, 'Third Quiz', 'Test description');
    const quiz3Id = (quiz3Res as QuizId).quizId;

    const res = rqstHead('GET', '/v1/admin/quiz/list', { session: session1 });

    expect(res.body).toStrictEqual({
      quizzes: [
        { quizId: quiz1Id, name: 'First Quiz' },
        { quizId: quiz2Id, name: 'Second Quiz' },
        { quizId: quiz3Id, name: 'Third Quiz' }
      ]
    });
    expect(res.statusCode).toStrictEqual(200);
  });
});

describe('GET /v1/admin/quiz/list - Error cases', () => {
  test('invalid session', () => {
    const res = rqstHead('GET', '/v1/admin/quiz/list', { session: 'invalid-session-123' });
    expect(res.body).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('empty session', () => {
    const res = rqstHead('GET', '/v1/admin/quiz/list', { session: '' });
    expect(res.body).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('missing session header', () => {
    const res = request('GET', SERVER_URL + '/v1/admin/quiz/list', {
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(401);
  });
});
