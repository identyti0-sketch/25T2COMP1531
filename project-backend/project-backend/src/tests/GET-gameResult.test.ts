import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { SessionId, QuizId } from '../interface';
import {
  clearHelper,
  authRegisterHelper,
  quizCreateHelper,
  questionCreateHelper,
  gameStartHelper
} from './testHelper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clearHelper();
});

describe('GET /v1/admin/quiz/:quizid/game/:gameid/results', () => {
  let userSession: string;
  let quizId: number;
  let gameId: number;

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

    const gameRes = gameStartHelper(quizId, userSession, 5);
    gameId = (gameRes as { gameId: number }).gameId;

    const data = require('../dataStore').getData();
    for (const qId in data.games) {
      const games = data.games[qId];
      for (const game of games) {
        if (game.gameId === gameId) {
          game.state = 'FINAL_RESULTS';
          break;
        }
      }
    }
    require('../dataStore').saveData();
  });

  describe('Success cases', () => {
    test('Valid game results', () => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}/results`,
        {
          headers: { session: userSession },
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        usersRankedByScore: expect.any(Array),
        questionResults: expect.any(Array)
      });
      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('Error cases', () => {
    test('Invalid game ID', () => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/admin/quiz/${quizId}/game/99999/results`,
        {
          headers: { session: userSession },
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'INVALID_GAME_ID',
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Game not in FINAL_RESULTS state', () => {
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
        SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}/results`,
        {
          headers: { session: userSession },
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Unauthorised session', () => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}/results`,
        {
          headers: { session: 'invalidsession' },
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'UNAUTHORISED',
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quiz ID', () => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/admin/quiz/99999/game/${gameId}/results`,
        {
          headers: { session: userSession },
          timeout: TIMEOUT_MS
        }
      );

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(403);
    });
  });
});
