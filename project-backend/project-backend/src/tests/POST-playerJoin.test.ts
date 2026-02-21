import request from 'sync-request-curl';
import config from '../config.json';
import { ERROR, questionCreateHelper, rqstBody } from './testHelper';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// clear
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('POST /v1/player/join', () => {
  let sessionId: string;
  let quizId: number;
  let gameId : number;
  beforeEach(() => {
    sessionId = (JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'samuel.mu753@gmail.com',
          password: 'abcd1234',
          nameFirst: 'Samuel',
          nameLast: 'Mu'
        },
        timeout: TIMEOUT_MS
      }).body.toString())).session;
    quizId = (JSON.parse(request('POST', SERVER_URL + '/v1/admin/quiz',
      {
        headers: { session: sessionId },
        json: {
          name: 'My Quiz Name',
          description: 'A description of my quiz'
        },
        timeout: TIMEOUT_MS
      }).body.toString())).quizId;
    questionCreateHelper(quizId, sessionId, {
      question: 'Monarch of England?',
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
    }
    );
    gameId = (JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`,
      {
        headers: { session: sessionId },
        json: { autoStartNum: 2 },
        timeout: TIMEOUT_MS
      }).body.toString())).gameId;
  });
  test('Success Case: Single player', () => {
    const res = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' });
    expect(res.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Success Case: Single player no name', () => {
    const res = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: '' });
    expect(res.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Success Case: Two players', () => {
    const res = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' });
    const res2 = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel moo' });
    expect(res.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(200);
    expect(res2.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(res2.statusCode).toStrictEqual(200);
  });
  test('Fail: Invalid characters in name', () => {
    const res = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu!' });
    expect(res.body).toStrictEqual(ERROR('INVALID_PLAYER_NAME'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Fail: Duplicate name', () => {
    const res = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' });
    const res2 = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' });
    expect(res.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(200);
    expect(res2.body).toStrictEqual(ERROR('INVALID_PLAYER_NAME'));
    expect(res2.statusCode).toStrictEqual(400);
  });
  test('Fail: Invalid gameID', () => {
    const res = rqstBody('POST', '/v1/player/join',
      { gameId: gameId + 1, playerName: 'samuel mu' });
    expect(res.body).toStrictEqual(ERROR('INVALID_GAME_ID'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Fail: game isn\'t in lobby', () => {
    const res = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' });
    const res2 = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel moo' });
    const res3 = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mooo' });
    expect(res.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(res.statusCode).toStrictEqual(200);
    expect(res2.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(res2.statusCode).toStrictEqual(200);
    expect(res3.body).toStrictEqual(ERROR('INCOMPATIBLE_GAME_STATE'));
    expect(res3.statusCode).toStrictEqual(400);
  });
});
