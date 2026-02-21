import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { SessionId, QuizId } from '../interface';
import {
  clearHelper,
  authRegisterHelper,
  quizCreateHelper,
  rqstBodyHead,
  questionCreateHelper
} from './testHelper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clearHelper();
});

describe('POST /v1/admin/quiz - Success cases', () => {
  let userSession: string;

  beforeEach(() => {
    const registerRes = authRegisterHelper('email@email.com', 'password1', 'firstname', 'lastname');
    userSession = (registerRes as SessionId).session;
  });

  test('Valid Input', () => {
    const res = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: 'Valid Quiz Name',
      description: 'Valid description'
    });

    expect(res.body).toStrictEqual({
      quizId: expect.any(Number)
    });
    expect(res.statusCode).toStrictEqual(200);
  });

  test('No Description', () => {
    const res = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: 'Valid Quiz Name',
      description: ''
    });

    expect(res.body).toStrictEqual({
      quizId: expect.any(Number)
    });
    expect(res.statusCode).toStrictEqual(200);
  });

  test('Multiple quizzes with different names', () => {
    const res1 = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: 'Quiz One',
      description: 'First quiz'
    });

    const res2 = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: 'Quiz Two',
      description: 'Second quiz'
    });

    const quiz1Id = res1.body.quizId;
    const quiz2Id = res2.body.quizId;

    expect(quiz1Id).not.toEqual(quiz2Id);
    expect(res1.statusCode).toStrictEqual(200);
    expect(res2.statusCode).toStrictEqual(200);
  });

  test('Different users can create quizzes with same name', () => {
    const registerRes2 = authRegisterHelper('user2@email.com', 'password1', 'user', 'two');
    const userSession2 = (registerRes2 as SessionId).session;

    const res1 = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: 'Duplicate Name Quiz',
      description: 'First quiz'
    });

    const res2 = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession2 }, {
      name: 'Duplicate Name Quiz',
      description: 'Second quiz'
    });

    expect(res1.body).toStrictEqual({
      quizId: expect.any(Number)
    });
    expect(res2.body).toStrictEqual({
      quizId: expect.any(Number)
    });
    expect(res1.statusCode).toStrictEqual(200);
    expect(res2.statusCode).toStrictEqual(200);
  });
});

describe('POST /v1/admin/quiz - Error cases', () => {
  let userSession: string;

  beforeEach(() => {
    const registerRes = authRegisterHelper('email@email.com', 'password1', 'firstname', 'lastname');
    userSession = (registerRes as SessionId).session;
  });

  test.each([
    {
      description: 'Invalid session',
      session: 'invalid-session-123',
      name: 'Valid Quiz Name',
      desc: 'Valid description',
      hasSession: true
    },
    {
      description: 'Empty session',
      session: '',
      name: 'Valid Quiz Name',
      desc: 'Valid description',
      hasSession: true
    },
    {
      description: 'Missing session header',
      session: undefined,
      name: 'Valid Quiz Name',
      desc: 'Valid description',
      hasSession: false
    }
  ])('$description', ({ session, name, desc, hasSession }) => {
    let res;
    if (hasSession) {
      res = rqstBodyHead('POST', '/v1/admin/quiz', { session: session }, {
        name: name,
        description: desc
      });
    } else {
      res = request('POST', SERVER_URL + '/v1/admin/quiz', {
        json: {
          name: name,
          description: desc
        },
        timeout: TIMEOUT_MS
      });
      res = { body: JSON.parse(res.body.toString()), statusCode: res.statusCode };
    }

    expect(res.body).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(401);
  });

  test.each([
    {
      description: 'Invalid Name Characters',
      name: 'name!',
      desc: 'Valid description'
    },
    {
      description: 'Invalid Name Length (empty)',
      name: '',
      desc: 'Valid description'
    },
    {
      description: 'Invalid Name Length (< 3)',
      name: 'na',
      desc: 'Valid description'
    },
    {
      description: 'Invalid Name Length (> 30)',
      name: 'name'.repeat(10),
      desc: 'Valid description'
    }
  ])('$description', ({ name, desc }) => {
    const res = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: name,
      description: desc
    });

    expect(res.body).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('Invalid Name Duplicate', () => {
    quizCreateHelper(userSession, 'Duplicate Name', 'First quiz');

    const res = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: 'Duplicate Name',
      description: 'Second quiz'
    });

    expect(res.body).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('Invalid Description (> 100 characters)', () => {
    const longDescription = 'description'.repeat(10);
    const res = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, {
      name: 'Valid Quiz Name',
      description: longDescription
    });

    expect(res.body).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(400);
  });

  test.each([
    {
      description: 'Missing name field',
      body: { description: 'Valid description' }
    },
    {
      description: 'Missing description field',
      body: { name: 'Valid Quiz Name' }
    }
  ])('$description', ({ body }) => {
    const res = rqstBodyHead('POST', '/v1/admin/quiz', { session: userSession }, body);

    expect(res.body).toStrictEqual({
      error: expect.any(String),
      message: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(400);
  });
});

describe('INVALID_QUESTION', () => {
  test('time exceeds 3 mins (180sec)', () => {
    const registerRes = authRegisterHelper('test@example.com', 'password123', 'Test', 'User');
    const userSession = (registerRes as SessionId).session;

    const quizRes = quizCreateHelper(userSession, 'Test Quiz', 'A test quiz');
    const quizId = (quizRes as QuizId).quizId;

    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 200,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ]
    };
    const res = questionCreateHelper(quizId, userSession, questionBody);

    expect(res).toStrictEqual({
      error: 'INVALID_TIMELIMIT',
      message: expect.any(String)
    });
  });
});
