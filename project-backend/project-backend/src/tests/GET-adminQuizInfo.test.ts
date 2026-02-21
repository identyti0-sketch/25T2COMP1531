import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ERROR, rqstBody, rqstBodyHead, rqstHead } from './testHelper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('GET /v1/admin/quiz/{quizid}, single user', () => {
  let sessionId: string;
  let quizId: number;
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
        name: 'quiz 1',
        description: 'Lorem ipsum'
      }).body.quizId;
  });
  test('Success Case', () => {
    const res = rqstHead('GET', `/v1/admin/quiz/${quizId}`, { session: sessionId });
    expect(res.body).toStrictEqual({
      quizId,
      name: 'quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Lorem ipsum',
      numQuestions: 0,
      questions: [],
      timeLimit: 0,
      thumbnailUrl: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Invalid session Id', () => {
    const res = rqstHead('GET', `/v1/admin/quiz/${quizId}`, { session: sessionId + '1' });
    expect(res.body).toStrictEqual(ERROR('UNAUTHORISED'));
    expect(res.statusCode).toStrictEqual(401);
  });
  test('Invalid session Id', () => {
    const res = rqstHead('GET', `/v1/admin/quiz/${quizId + 1}`, { session: sessionId });
    expect(res.body).toStrictEqual(ERROR('INVALID_QUIZ_ID'));
    expect(res.statusCode).toStrictEqual(403);
  });
});

describe('GET /v1/admin/quiz/{quizid}, single user', () => {
  test('Success Case', () => {
    const sessionId = rqstBody('POST', '/v1/admin/auth/register',
      {
        email: 'samuel.mu753@gmail.com',
        password: 'abcd1234',
        nameFirst: 'Samuel',
        nameLast: 'Mu'
      }).body.session;
    const quizId = rqstBodyHead('POST', '/v1/admin/quiz', { session: sessionId },
      {
        name: 'quiz 1',
        description: 'Lorem ipsum'
      }).body.quizId;
    const quest1 = rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/question`, { session: sessionId },
      {
        questionBody: {
          question: 'Whats 1 + 1?',
          timeLimit: 4,
          points: 3,
          answerOptions: [
            {
              answer: '2',
              correct: true
            },
            {
              answer: '3',
              correct: false
            }
          ],
          thumbnailUrl: 'http://google.com/some/image/path.jpg'
        }
      }).body.questionId;
    const quest2 = rqstBodyHead('POST', `/v1/admin/quiz/${quizId}/question`, { session: sessionId },
      {
        questionBody: {
          question: 'Whats a root of 4?',
          timeLimit: 4,
          points: 3,
          answerOptions: [
            {
              answer: '2',
              correct: true
            },
            {
              answer: '-2',
              correct: true
            },
            {
              answer: '2i',
              correct: false
            }
          ],
          thumbnailUrl: 'http://google.com/some/image/path2.jpg'
        }
      }).body.questionId;
    const res = rqstHead('GET', `/v1/admin/quiz/${quizId}`, { session: sessionId });
    expect(res.body).toStrictEqual({
      quizId,
      name: 'quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Lorem ipsum',
      numQuestions: 2,
      questions: [
        {
          questionId: quest1,
          question: 'Whats 1 + 1?',
          timeLimit: 4,
          points: 3,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: '2',
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: '3',
              correct: false
            },
          ],
          thumbnailUrl: 'http://google.com/some/image/path.jpg'
        },
        {
          questionId: quest2,
          question: 'Whats a root of 4?',
          timeLimit: 4,
          points: 3,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: '2',
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: '-2',
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: '2i',
              correct: false
            }
          ],
          thumbnailUrl: 'http://google.com/some/image/path2.jpg'
        }
      ],
      timeLimit: 8,
      thumbnailUrl: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(200);
  });
});
