
import request from 'sync-request-curl';
import config from '../config.json';
import { ERROR, questionCreateHelper, rqstBody, rqstBodyHead, rqstHead } from './testHelper';
import { Answer } from '../interface';
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
  let answers: Answer[];
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
    gameId = rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/game/start`,
      { session: sessionId },
      { autoStartNum: 1 }).body.gameId;
    playerId = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' }).body.playerId;
    answers = rqstHead('GET', `/v1/admin/quiz/${quizId}/game/${gameId}`,
      { session: sessionId }).body.metadata.questions[1].answerOptions;
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'SKIP_COUNTDOWN'
    });
  });
  test('Invalid player Id', () => {
    const res = rqstBody('PUT', `/v1/player/${playerId - 1}/question/1/answer`, {
      answerIds: [answers[0].answerId]
    });
    expect(res.body).toStrictEqual(ERROR('INVALID_PLAYER_ID'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Invalid position', () => {
    const res = rqstBody('PUT', `/v1/player/${playerId}/question/2/answer`, {
      answerIds: [answers[1].answerId]
    });
    expect(res.body).toStrictEqual(ERROR('INVALID_POSITION'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Incompatible game state', () => {
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'GO_TO_ANSWER'
    });
    const res = rqstBody('PUT', `/v1/player/${playerId}/question/${1}/answer`, {
      answerIds: [answers[0].answerId]
    });
    expect(res.body).toStrictEqual(ERROR('INCOMPATIBLE_GAME_STATE'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Invalid answer ids, wrong id', () => {
    const res = rqstBody('PUT', `/v1/player/${playerId}/question/1/answer`, {
      answerIds: [answers[0].answerId - 1]
    });
    expect(res.body).toStrictEqual(ERROR('INVALID_ANSWER_IDS'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Invalid answer ids, no answers', () => {
    const res = rqstBody('PUT', `/v1/player/${playerId}/question/1/answer`, {
      answerIds: []
    });
    expect(res.body).toStrictEqual(ERROR('INVALID_ANSWER_IDS'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Invalid answer ids, duplicate answer', () => {
    const res = rqstBody('PUT', `/v1/player/${playerId}/question/1/answer`, {
      answerIds: [answers[0].answerId, answers[0].answerId]
    });
    expect(res.body).toStrictEqual(ERROR('INVALID_ANSWER_IDS'));
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Success Case, default', () => {
    const res = rqstBody('PUT', `/v1/player/${playerId}/question/1/answer`, {
      answerIds: [answers[0].answerId]
    });
    expect(res.body).toStrictEqual({});
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Success Case, 2 answers', () => {
    const res = rqstBody('PUT', `/v1/player/${playerId}/question/1/answer`, {
      answerIds: [answers[0].answerId, answers[1].answerId]
    });
    expect(res.body).toStrictEqual({});
    expect(res.statusCode).toStrictEqual(200);
  });
});
