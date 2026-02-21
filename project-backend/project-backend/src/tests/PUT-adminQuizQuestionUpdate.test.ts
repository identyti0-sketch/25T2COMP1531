import request from 'sync-request-curl';
import config from '../config.json';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// clear
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('Success case', () => {
  test('create a new quiz question', () => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    const userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    // POST a question
    const questionId = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`,
      {
        json: { questionBody },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      }).body.toString()).questionId;

    const newQuestion = {
      questionId,
      question: '2 + 2 ?',
      timeLimit: 30,
      points: 6,
      answerOptions: [
        {
          answer: '4',
          correct: true
        },
        {
          answer: '2',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(resPUT.body.toString())).toStrictEqual({ });
    expect(resPUT.statusCode).toStrictEqual(200);
    // check really updated
    const resGet = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(resGet.body.toString()).questions[0]).toStrictEqual({
      questionId,
      question: '2 + 2 ?',
      timeLimit: 30,
      points: 6,
      answerOptions: [
        {
          answer: '4',
          correct: true
        },
        {
          answer: '2',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    });
    expect(resGet.statusCode).toBe(200);
  });
});

describe('UNAUTHORISED', () => {
  test('Testing: no such user', () => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    const userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    };
    // POST a question
    const questionId = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`,
      {
        json: { questionBody },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      }).body.toString()).questionId;

    const newQuestion = {
      question: '2 + 2 ?',
      timeLimit: 30,
      points: 6,
      answerOptions: [
        {
          answer: '4',
          correct: true
        },
        {
          answer: '2',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    };

    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: 'invalidSession' },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toStrictEqual(401);
    expect(JSON.parse(resPUT.body.toString())).toStrictEqual({
      error: 'UNAUTHORISED',
      message: expect.any(String)
    });
  });
});

describe('INVALID_QUIZ_ID', () => {
  test('Testing: No such QuizID', () => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    const userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ]
    };
    // POST a question
    request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
      json: { questionBody },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    const newQuestion = {
      question: '2 + 2 ?',
      timeLimit: 30,
      points: 6,
      answerOptions: [
        {
          answer: '4',
          correct: true
        },
        {
          answer: '2',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    };

    // Update question
    // wrong quiz Id
    const resPUT = request('PUT', SERVER_URL +
      `/v1/admin/quiz/${quizId + 10}/question/:questionid`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toStrictEqual(403);
    expect(JSON.parse(resPUT.body.toString())).toStrictEqual({
      error: 'INVALID_QUIZ_ID',
      message: expect.any(String)
    });
  });

  test('Testing: Not the correct owner', () => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    const userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    const quizId = JSON.parse(quizRes.body.toString()).quizId;

    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    };
    // POST a question
    const questionId = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`,
      {
        json: { questionBody },
        headers: { session: userSession },
        timeout: TIMEOUT_MS
      }).body.toString()).questionId;

    // Another User
    const registerRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'testttt@example.com',
        password: 'password678',
        nameFirst: 'First',
        nameLast: 'Last'
      },
      timeout: TIMEOUT_MS
    });
    const userSession2 = JSON.parse(registerRes2.body.toString()).session;

    const newQuestion = {
      question: '2 + 2 ?',
      timeLimit: 30,
      points: 6,
      answerOptions: [
        {
          answer: '4',
          correct: true
        },
        {
          answer: '2',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    };

    // Second person uses first person's quizId
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession2 },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toStrictEqual(403);
    expect(JSON.parse(resPUT.body.toString())).toStrictEqual({
      error: 'INVALID_QUIZ_ID',
      message: expect.any(String)
    });
  });
});

// 400
describe('INVALID_QUESTION', () => {
  let userSession: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;

    // Add initial question
    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/image.jpg'
    };

    const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
      json: { questionBody },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    questionId = JSON.parse(res.body.toString()).questionId;
  });

  test('Testing: question string too short', () => {
    const newQuestion = {
      question: 'hi', // Too short (should be at least 5 characters)
      timeLimit: 30,
      points: 6,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '2', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/image.jpg'
    };

    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_QUESTION',
      message: expect.any(String)
    });
  });

  test('Testing: Question string too long', () => {
    const newQuestion = {
      question: 'abcdefghijklmnopqrstuwxyzabcdefghijklmnopqrstuwxyz555',
      timeLimit: 30,
      points: 6,
      answerOptions: [
        {
          answer: '4',
          correct: true
        },
        {
          answer: '2',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/integer/path.jpg'
    };

    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_QUESTION',
      message: expect.any(String)
    });
  });

  test('Testing: porints less than 1', () => {
    const newQuestion = {
      question: 'abcdefghijklmn',
      timeLimit: 4,
      points: 0,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_QUESTION',
      message: expect.any(String)
    });
  });
  test('Testing: porints more than 10', () => {
    const newQuestion = {
      question: 'abcdefghijklmn',
      timeLimit: 4,
      points: 16,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_QUESTION',
      message: expect.any(String)
    });
  });
});

describe('INVALID_ANSWERS', () => {
  let userSession: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;

    // Add initial question
    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/image.jpg'
    };

    const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
      json: { questionBody },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    questionId = JSON.parse(res.body.toString()).questionId;
  });

  test('too few answers', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_ANSWERS',
      message: expect.any(String)
    });
  });

  test('too many answers', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        },
        {
          answer: 'Prince Charles3',
          correct: true
        },
        {
          answer: 'Prince Charles4',
          correct: true
        },
        {
          answer: 'Prince Charles5',
          correct: true
        },
        {
          answer: 'Prince Charles6',
          correct: true
        },
        {
          answer: 'Prince Charles7',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_ANSWERS',
      message: expect.any(String)
    });
  });

  test('length of answer too short', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: '',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_ANSWERS',
      message: expect.any(String)
    });
  });
  test('length of answer too long', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'abcdefghijklmnopqrstuwxyzabcdefghijklmnopqrstuwxyz',
          correct: true
        },
        {
          answer: 'abcdefghijkl',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_ANSWERS',
      message: expect.any(String)
    });
  });

  test('duplicated answer', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'answer',
          correct: true
        },
        {
          answer: 'answer',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_ANSWERS',
      message: expect.any(String)
    });
  });
  test('no correct answer', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'not the answer',
          correct: false
        },
        {
          answer: 'not the answer2',
          correct: false
        },
        {
          answer: 'not the answer3',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_ANSWERS',
      message: expect.any(String)
    });
  });
});

describe('INVALID_TIMELIMIT', () => {
  let userSession: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;

    // Add initial question
    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/image.jpg'
    };

    const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
      json: { questionBody },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    questionId = JSON.parse(res.body.toString()).questionId;
  });

  test('question timeLimit is not a positive number', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: -10,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_TIMELIMIT',
      message: expect.any(String)
    });
  });
  test('timeLimits in the quiz exceeds 3 minutes (180 sec)', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 200,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_TIMELIMIT',
      message: expect.any(String)
    });
  });
});

describe('INVALID_THUMBNAIL', () => {
  let userSession: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    // Register user
    const registerRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@example.com',
        password: 'password123',
        nameFirst: 'Test',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS
    });
    userSession = JSON.parse(registerRes.body.toString()).session;

    // Create a quiz
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Test Quiz',
        description: 'A test quiz'
      },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;

    // Add initial question
    const questionBody = {
      question: 'What is 2 + 2?',
      timeLimit: 30,
      points: 5,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '5', correct: false }
      ],
      thumbnailUrl: 'http://google.com/some/image.jpg'
    };

    const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
      json: { questionBody },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });
    questionId = JSON.parse(res.body.toString()).questionId;
  });

  test('thumbnailUrl is an empty string', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles25678',
          correct: true
        }
      ],
      thumbnailUrl: ''
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_THUMBNAIL',
      message: expect.any(String)
    });
  });
  test('case insensitive', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.gov'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_THUMBNAIL',
      message: expect.any(String)
    });
  });
  test('thumbnailUrl does not begin with https://', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        }
      ],
      thumbnailUrl: 'httppss://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_THUMBNAIL',
      message: expect.any(String)
    });
  });
  test('thumbnailUrl does not begin with http://', () => {
    const newQuestion = {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Charles2',
          correct: true
        }
      ],
      thumbnailUrl: 'hellop://google.com/some/image/path.jpg'
    };
    const resPUT = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: { questionBody: newQuestion },
      headers: { session: userSession },
      timeout: TIMEOUT_MS
    });

    expect(resPUT.statusCode).toBe(400);
    expect(JSON.parse(resPUT.body.toString())).toEqual({
      error: 'INVALID_THUMBNAIL',
      message: expect.any(String)
    });
  });
});
