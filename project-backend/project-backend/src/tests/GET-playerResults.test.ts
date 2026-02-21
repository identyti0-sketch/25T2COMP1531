
import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { SessionId, QuizId, Game } from '../interface';
import {
  clearHelper,
  authRegisterHelper,
  quizCreateHelper,
  questionCreateHelper,
  gameStartHelper,
  statusUpdateHelper,
  gameInfoHelper,
  playerSubmissionHelper
} from './testHelper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clearHelper();
});

describe('GET /v1/player/:playerid/results', () => {
  let userSession: string;
  let quizId: number;
  let gameId: number;
  let playerId: number;

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

    const joinResponse = request('POST', SERVER_URL + '/v1/player/join', {
      json: {
        gameId: gameId,
        playerName: 'Player1'
      },
      timeout: TIMEOUT_MS
    });
    playerId = JSON.parse(joinResponse.body.toString()).playerId;
    statusUpdateHelper('NEXT_QUESTION', gameId, quizId, userSession);
    statusUpdateHelper('SKIP_COUNTDOWN', gameId, quizId, userSession);
    const game = gameInfoHelper(userSession, quizId, gameId) as Game;
    playerSubmissionHelper(playerId, game.atQuestion,
      game.metadata.questions[game.atQuestion]
        .answerOptions.find(option => option.correct === true).answerId);
    statusUpdateHelper('GO_TO_ANSWER', gameId, quizId, userSession);
    statusUpdateHelper('GO_TO_FINAL_RESULTS', gameId, quizId, userSession);
  });
  describe('Success cases', () => {
    test('Valid results for a player', () => {
      const res = request(
        'GET',
        SERVER_URL + `/v1/player/${playerId}/results`,
        {
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
    test('Invalid player ID', () => {
      const res = request('GET', SERVER_URL + '/v1/player/99999/results', {
        timeout: TIMEOUT_MS
      });

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
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
        SERVER_URL + `/v1/player/${playerId}/results`,
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
        SERVER_URL + '/v1/player/invalidstring/results',
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
