
import request from 'sync-request-curl';
import config from '../config.json';
import { ERROR, questionCreateHelper, rqstBody, rqstBodyHead, rqstHead } from './testHelper';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// clear
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('GET /v1/player/:playerid', () => {
  let sessionId: string;
  let quizId: number;
  let gameId1: number;
  let gameId2: number;
  beforeEach(() => {
    sessionId = rqstBody('POST', '/v1/admin/auth/register',
      {
        email: 'samuel.mu753@gmail.com',
        password: 'abcd1234',
        nameFirst: 'Samuel',
        nameLast: 'Mu'
      }).body.session;
    quizId = rqstBodyHead('POST', '/v1/admin/quiz', { session: sessionId },
      {
        name: 'My Quiz Name',
        description: 'A description of my quiz'
      }).body.quizId;
    questionCreateHelper(quizId, sessionId, {
      question: 'Monarch of England?',
      timeLimit: 9,
      points: 5,
      answerOptions: [
        {
          answer: 'King Charles',
          correct: true
        },
        {
          answer: 'Prince Charles',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    });
    questionCreateHelper(quizId, sessionId, {
      question: 'Monarch of England2?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'King Charles',
          correct: true
        },
        {
          answer: 'Prince Charles',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    });
    gameId1 = rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/game/start`,
      { session: sessionId },
      { autoStartNum: 1 }).body.gameId;
    gameId2 = rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/game/start`,
      { session: sessionId },
      { autoStartNum: 1 }).body.gameId;
    rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/game/start`,
      { session: sessionId },
      { autoStartNum: 1 });
    rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/game/start`,
      { session: sessionId },
      { autoStartNum: 1 });
    rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/game/start`,
      { session: sessionId },
      { autoStartNum: 1 });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId1}`, { session: sessionId }, {
      action: 'END'
    });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId2}`, { session: sessionId }, {
      action: 'END'
    });
  });
  test('Unauthorised', () => {
    const res = rqstHead('GET', `/v1/admin/quiz/${quizId}/games`, {
      session: sessionId + 1
    });
    expect(res.body).toStrictEqual(ERROR('UNAUTHORISED'));
    expect(res.statusCode).toStrictEqual(401);
  });
  test('Invalid quiz ID', () => {
    const res = rqstHead('GET', `/v1/admin/quiz/${quizId - 1}/games`, {
      session: sessionId
    });
    expect(res.body).toStrictEqual(ERROR('INVALID_QUIZ_ID'));
    expect(res.statusCode).toStrictEqual(403);
  });
  test('Success Case, default', () => {
    const res = rqstHead('GET', `/v1/admin/quiz/${quizId}/games`, {
      session: sessionId
    });
    expect(res.body).toEqual({
      activeGames: [
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      ],
      inactiveGames: [
        expect.any(Number),
        expect.any(Number),
      ]
    });
    expect(res.statusCode).toStrictEqual(200);
  });
});
