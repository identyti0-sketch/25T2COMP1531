import request from 'sync-request-curl';
import config from '../config.json';
import { ERROR, questionCreateHelper, rqst, rqstBody, rqstBodyHead } from './testHelper';
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
  let gameId : number;
  let playerId: number;
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
    gameId = rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/game/start`,
      { session: sessionId },
      { autoStartNum: 2 }).body.gameId;
    playerId = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' }).body.playerId;
  });
  test('Invalid playerId', () => {
    const res = rqst('GET', `/v1/player/${playerId - 1}`);
    expect(res.body).toStrictEqual(ERROR('INVALID_PLAYER_ID'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Success Case 1 player', () => {
    const res = rqst('GET', `/v1/player/${playerId}`);
    expect(res.body).toStrictEqual(
      {
        state: 'LOBBY',
        numQuestions: 2,
        atQuestion: 0
      }
    );
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Success Case 2 players', () => {
    rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'sam2' });
    const res = rqst('GET', `/v1/player/${playerId}`);
    expect(res.body).toStrictEqual(
      {
        state: 'QUESTION_COUNTDOWN',
        numQuestions: 2,
        atQuestion: 1
      }
    );
    expect(res.statusCode).toStrictEqual(200);
  });
});
