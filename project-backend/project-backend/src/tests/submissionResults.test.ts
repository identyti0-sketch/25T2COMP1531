
import request from 'sync-request-curl';
import config from '../config.json';
import { questionCreateHelper, rqst, rqstBody, rqstBodyHead } from './testHelper';
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
  let playerId1: number;
  let playerId2: number;
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
      points: 3,
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
      points: 8,
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
    playerId1 = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: 'samuel mu' }).body.playerId;
    playerId2 = rqstBody('POST', '/v1/player/join',
      { gameId, playerName: '' }).body.playerId;
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'SKIP_COUNTDOWN'
    });
  });
  test('Success Case, default', () => {
    answers = rqst('GET', `/v1/player/${playerId1}/question/1`).body.answerOptions;
    expect(answers).toStrictEqual(expect.arrayContaining([
      {
        answerId: expect.any(Number),
        answer: expect.any(String),
        correct: expect.any(Boolean)
      }]
    ));
    rqstBody('PUT', `/v1/player/${playerId1}/question/1/answer`, {
      answerIds: [answers[0].answerId]
    });
    rqstBody('PUT', `/v1/player/${playerId2}/question/1/answer`, {
      answerIds: [answers[1].answerId]
    });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'GO_TO_ANSWER'
    });
    const res = rqst('GET', `/v1/player/${playerId1}/question/1/results`).body;
    expect(res).toStrictEqual({
      questionId: expect.any(Number),
      playersCorrect: [
        'samuel mu'
      ],
      averageAnswerTime: 0,
      percentCorrect: 50
    });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'NEXT_QUESTION'
    });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'SKIP_COUNTDOWN'
    });
    answers = rqst('GET', `/v1/player/${playerId1}/question/2`).body.answerOptions;
    expect(answers).toStrictEqual(expect.arrayContaining([
      {
        answerId: expect.any(Number),
        answer: expect.any(String),
        correct: expect.any(Boolean)
      }]
    ));
    rqstBody('PUT', `/v1/player/${playerId1}/question/1/answer`, {
      answerIds: [answers[0].answerId, answers[1].answerId]
    });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'GO_TO_ANSWER'
    });
    const res2 = rqst('GET', `/v1/player/${playerId1}/question/2/results`).body;
    expect(res2).toStrictEqual({
      questionId: expect.any(Number),
      playersCorrect: [],
      averageAnswerTime: 0,
      percentCorrect: 0
    });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: sessionId }, {
      action: 'GO_TO_FINAL_RESULTS'
    });
    const res3 = rqst('GET', `/v1/player/${playerId1}/results`).body;
    const expected = {
      usersRankedByScore: [
        { playerName: 'samuel mu', score: 3 },
        { playerName: expect.any(String), score: 0 }
      ],
      questionResults: [
        {
          questionId: expect.any(Number),
          playersCorrect: ['samuel mu'],
          averageAnswerTime: 0,
          percentCorrect: 50
        },
        {
          questionId: expect.any(Number),
          playersCorrect: [],
          averageAnswerTime: 0,
          percentCorrect: 0
        }
      ]
    };
    expect(res3).toStrictEqual(expected);
  });
});
