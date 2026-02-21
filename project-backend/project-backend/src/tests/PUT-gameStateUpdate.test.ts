import request from 'sync-request-curl';
import config from '../config.json';
import { ERROR, questionCreateHelper, rqstBodyHead } from './testHelper';
import sleepSync from 'slync';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// clear
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('PUT-Game Status Update', () => {
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
      timeLimit: 2,
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
    questionCreateHelper(quizId, sessionId, {
      question: 'Monarch of England?2',
      timeLimit: 2,
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
  test('Success Case: successfully updating game state', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });
  test('Invalid session id', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId + 10 },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'UNAUTHORISED',
      message: expect.any(String)
    });
  });
  test('invalid quize id', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId + 10}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INVALID_QUIZ_ID',
      message: expect.any(String)
    });
  });
  test('not the correct owner of the quiz', () => {
    const anotherSessionId = (JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register',
      {
        json: {
          email: 'anthenasu@gmail.com',
          password: 'abcd6788',
          nameFirst: 'Anthena',
          nameLast: 'Su'
        },
        timeout: TIMEOUT_MS
      }).body.toString())).session;
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: anotherSessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INVALID_QUIZ_ID',
      message: expect.any(String)
    });
  });
  test('invalid game id', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId + 10}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INVALID_GAME_ID',
      message: expect.any(String)
    });
  });
  test('invalid game state / action', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NOT_GOOD' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INVALID_ACTION',
      message: expect.any(String)
    });
  });
  test('Successfully changed from LOBBY -> NEXT_QUESTION', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });
  test('Successfully changed from LOBBY -> END', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });
  test('incompatible game state: LOBBY -> SKIP_COUNTDOWN', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });
  test('incompatible game state: LOBBY -> GO_TO_ANSWER', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });
  test('incompatible game state: LOBBY -> QUESTION_CLOSE', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('Successfully changed from NEXT_QUESTION -> SKIP_COUNTDOWN', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });

    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' }
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({});
    expect(result.statusCode).toBe(200);
  });

  test('Successfully changed from NEXT_QUESTION -> END', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });

    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });

  test('incompatible game state: NEXT_QUESTION -> GO_TO_FINAL_RESULTS', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> GO_TO_FINAL_RESULTS :( invalid
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('incompatible game state: NEXT_QUESTION -> GO_TO_ANSWER', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> GO_TO_ANSWER :( invalid
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  // SKIP_COUNTDOWN tests
  test('Successfully changed from SKIP_COUNTDOWN -> END', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> END
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });

  test('Successfully changed from SKIP_COUNTDOWN -> GO_TO_ANSWER', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> END
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });

  test('incompatible game state:  SKIP_COUNTDOWN -> QUESTION_CLOSE', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> END :( invalid
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('incompatible game state:  SKIP_COUNTDOWN -> GO_TO_FINAL_RESULTS', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> FINLA_RESULTS :( invalid
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('incompatible game state:  SKIP_COUNTDOWN -> NEXT_QUESTION', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> END :( invalid
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  // GO_TO_ANSWER tests
  test('Successfully changed from GO_TO_ANSWER -> END', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });

  test('Successfully changed from GO_TO_ANSWER -> GO_TO_FINAL_RESULTS', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });

  test('Successfully changed from GO_TO_ANSWER -> NEXT_QUESTION', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });

  test('incompatible game state: GO_TO_ANSWER -> SKIP_COUNTDOWN', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> SKIP_COUNTDOWN :(
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('Successfully changed from GO_TO_ANSWER -> QUESTION_CLOSE', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> SKIP_COUNTDOWN :(
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toEqual({});
    expect(result.statusCode).toBe(200);
  });

  test('incompatible game state: GO_TO_ANSWER -> GO_TO_ANSWER', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> SKIP_COUNTDOWN :(
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  // final_result tests
  test('Successfully changed from GO_TO_FINAL_RESULTS -> END', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // GO_TO_ANSWER -> GO_TO_FINAL_RESULTS :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'END' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body.toString())).toEqual({});
  });

  test('incompatible game state: GO_TO_FINAL_RESULTS -> GO_TO_ANSWER', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // GO_TO_ANSWER -> GO_TO_FINAL_RESULTS :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('incompatible game state: GO_TO_FINAL_RESULTS -> SKIP_COUNTDOWN', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // GO_TO_ANSWER -> GO_TO_FINAL_RESULTS :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('incompatible game state: GO_TO_FINAL_RESULTS -> NEXT_QUESTION', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // GO_TO_ANSWER -> GO_TO_FINAL_RESULTS :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('incompatible game state: GO_TO_FINAL_RESULTS -> GO_TO_FINAL_RESULTS', () => {
    // LOBBY -> NEXT_QUESTION :) valid
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    // NEXT_QUESTION -> SKIP_COUNTDOWN :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS
    });
    // SKIP_COUNTDOWN -> GO_TO_ANSWER :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS
    });
    // GO_TO_ANSWER -> GO_TO_FINAL_RESULTS :)
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body.toString())).toEqual({
      error: 'INCOMPATIBLE_GAME_STATE',
      message: expect.any(String)
    });
  });

  test('Success: TimeOut QUESTION_COUNTDOWN -> QUESTION_OPEN', () => {
    // LOBBY -> NEXT_QUESTION
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS
    });
    sleepSync(3.3 * 1000);
    // get game state
    const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('QUESTION_OPEN');
    expect(res.statusCode).toBe(200);

    sleepSync(2.5 * 1000);
    const res2 = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: sessionId },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('QUESTION_CLOSE');
    expect(res2.statusCode).toBe(200);
  });

  test('No more questions', () => {
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      session: sessionId
    }, { action: 'NEXT_QUESTION' });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      session: sessionId
    }, { action: 'SKIP_COUNTDOWN' });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      session: sessionId
    }, { action: 'GO_TO_ANSWER' });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      session: sessionId
    }, { action: 'NEXT_QUESTION' });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      session: sessionId
    }, { action: 'SKIP_COUNTDOWN' });
    rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      session: sessionId
    }, { action: 'GO_TO_ANSWER' });
    const res = rqstBodyHead('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      session: sessionId
    }, { action: 'NEXT_QUESTION' });
    expect(res.body).toStrictEqual(ERROR('INCOMPATIBLE_GAME_STATE'));
    expect(res.statusCode).toStrictEqual(400);
  });
});
