import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { SessionId, QuizId } from '../interface';
import {
  clearHelper,
  authRegisterHelper,
  quizCreateHelper,
  questionCreateHelper,
  gameStartHelper,
  rqstBodyHead
} from './testHelper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clearHelper();
});

describe('GET /v1/player/:playerid/question/:questionposition/results', () => {
  let userSession: string;
  let quizId: number;
  let gameId: number;
  let playerId: string;

  beforeEach(() => {
    const registerRes = authRegisterHelper(
      'example1@gmail.com', 'password123', 'User', 'One'
    );
    userSession = (registerRes as SessionId).session;

    const quizRes = quizCreateHelper(
      userSession, 'Math Quiz', 'Simple addition questions'
    );
    quizId = (quizRes as QuizId).quizId;

    const question1 = {
      question: 'What is 5 + 3?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '8', correct: true },
        { answer: '7', correct: false },
        { answer: '9', correct: false },
        { answer: '6', correct: false }
      ],
      thumbnailUrl: 'http://example.com/math1.jpg'
    };

    const question2 = {
      question: 'What is 12 + 7?',
      timeLimit: 25,
      points: 4,
      answerOptions: [
        { answer: '19', correct: true },
        { answer: '18', correct: false },
        { answer: '20', correct: false }
      ],
      thumbnailUrl: 'http://example.com/math2.jpg'
    };

    questionCreateHelper(quizId, userSession, question1);
    questionCreateHelper(quizId, userSession, question2);

    const gameRes = gameStartHelper(quizId, userSession, 1);
    gameId = (gameRes as { gameId: number }).gameId;

    const joinResponse = request('POST', SERVER_URL + '/v1/player/join', {
      json: {
        gameId: gameId,
        playerName: 'Player1'
      },
      timeout: TIMEOUT_MS
    });
    playerId = JSON.parse(joinResponse.body.toString()).playerId;

    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: userSession }, {
      action: 'SKIP_COUNTDOWN'
    });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: userSession }, {
      action: 'GO_TO_ANSWER'
    });
    // require('../dataStore').saveData();
  });

  describe('Success cases', () => {
    test('Valid question results for first question', () => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/question/1/results`,
        {
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        questionId: expect.any(Number),
        playersCorrect: expect.any(Array),
        averageAnswerTime: expect.any(Number),
        percentCorrect: expect.any(Number)
      });
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Valid question results for second question', () => {
      rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: userSession }, {
        action: 'NEXT_QUESTION'
      });
      rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: userSession }, {
        action: 'SKIP_COUNTDOWN'
      });
      rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: userSession }, {
        action: 'GO_TO_ANSWER'
      });
      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/question/2/results`,
        { timeout: TIMEOUT_MS }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        questionId: expect.any(Number),
        playersCorrect: expect.any(Array),
        averageAnswerTime: expect.any(Number),
        percentCorrect: expect.any(Number)
      });
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Question results shows correct player names', () => {
      request('POST', SERVER_URL + '/v1/player/join', {
        json: {
          gameId: gameId,
          playerName: 'Player2'
        },
        timeout: TIMEOUT_MS
      });

      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/question/1/results`,
        {
          timeout: TIMEOUT_MS
        }
      );

      const results = JSON.parse(res.body.toString());
      expect(results.playersCorrect).toEqual(expect.arrayContaining([]));
      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('Error cases', () => {
    test('Invalid player ID', () => {
      const res = request('GET', SERVER_URL + '/v1/player/99999/question/1/results', {
        timeout: TIMEOUT_MS
      });

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });

    test.each([
      { description: 'Question position too low', position: 0 },
      { description: 'Question position too high', position: 5 },
      { description: 'Negative question position', position: -1 }
    ])('$description', ({ position }) => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/question/${position}/results`,
        {
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Game not in ANSWER_SHOW state', () => {
      const data = require('../dataStore').getData();
      for (const qId in data.games) {
        const games = data.games[qId];
        for (const game of games) {
          if (game.gameId === gameId) {
            game.state = 'LOBBY';
            break;
          }
        }
      }
      require('../dataStore').saveData();

      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/question/1/results`,
        {
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Game not currently on this question', () => {
      rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, { session: userSession }, {
        action: 'NEXT_QUESTION'
      });

      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/question/1/results`,
        {
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Non-numeric question position', () => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/question/abc/results`,
        {
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Empty player ID string', () => {
      const res = request(
        'GET',
        SERVER_URL + '/v1/player/invalidstring/question/1/results',
        {
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });
  });
});
