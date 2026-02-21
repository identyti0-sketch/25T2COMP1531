import request from 'sync-request-curl';
import config from '../config.json';
import { SessionId, QuizId, QuestionId } from '../interface';
import {
  clearHelper,
  authRegisterHelper,
  quizCreateHelper,
  questionCreateHelper
} from './testHelper';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clearHelper();
});

describe('POST /v1/admin/quiz/:quizid/question', () => {
  let userSession: string;
  let quizId: number;

  beforeEach(() => {
    const registerRes = authRegisterHelper('test@example.com', 'password123', 'Test', 'User');
    userSession = (registerRes as SessionId).session;

    const quizRes = quizCreateHelper(userSession, 'Test Quiz', 'A test quiz');
    quizId = (quizRes as QuizId).quizId;
  });

  describe('Success cases', () => {
    test('Valid question creation', () => {
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

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        questionId: expect.any(Number)
      });
    });

    test('Multiple correct answers', () => {
      const questionBody = {
        question: 'Which are programming languages?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: 'JavaScript', correct: true },
          { answer: 'Python', correct: true },
          { answer: 'C++', correct: true },
          { answer: 'CSS', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg'
      };

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        questionId: expect.any(Number)
      });
    });

    test('Multiple questions in same quiz', () => {
      const question1 = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const question2 = {
        question: 'What is 3 + 3?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '6', correct: true },
          { answer: '7', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res1 = questionCreateHelper(quizId, userSession, question1);
      const res2 = questionCreateHelper(quizId, userSession, question2);

      const questionId1 = (res1 as QuestionId).questionId;
      const questionId2 = (res2 as QuestionId).questionId;

      expect(questionId1).not.toEqual(questionId2);
    });
  });

  describe('Error cases', () => {
    test.each([
      {
        description: 'Invalid session',
        session: 'invalid-session',
        statusCode: 401
      },
      {
        description: 'Empty session',
        session: '',
        statusCode: 401
      }
    ])('$description', ({ session, statusCode }) => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(quizId, session, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test('Missing session header', () => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
        json: { questionBody: questionBody },
        timeout: TIMEOUT_MS
      });

      expect(JSON.parse(res.body.toString())).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
      expect(res.statusCode).toStrictEqual(401);
    });

    test.each([
      {
        description: 'Quiz does not exist',
        quizId: 99999,
        statusCode: 403
      }
    ])('$description', ({ quizId: testQuizId, statusCode }) => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(testQuizId, userSession, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test('User does not own quiz', () => {
      const registerRes2 = authRegisterHelper('user2@example.com', 'password123', 'User', 'Two');
      const userSession2 = (registerRes2 as SessionId).session;

      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(quizId, userSession2, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test.each([
      {
        description: 'Question too short',
        question: 'A?'
      },
      {
        description: 'Question too long',
        question: 'A'.repeat(51) + '?'
      }
    ])('$description', ({ question }) => {
      const questionBody = {
        question: question,
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test.each([
      {
        description: 'Invalid time limit (zero)',
        timeLimit: 0
      },
      {
        description: 'Invalid time limit (negative)',
        timeLimit: -5
      },
      {
        description: 'Time limit exceeds total (180 seconds)',
        timeLimit: 200
      }
    ])('$description', ({ timeLimit }) => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: timeLimit,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test.each([
      {
        description: 'Invalid points (too low)',
        points: 0
      },
      {
        description: 'Invalid points (too high)',
        points: 11
      }
    ])('$description', ({ points }) => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: points,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test.each([
      {
        description: 'Too few answers',
        answerOptions: [{ answer: '4', correct: true }]
      },
      {
        description: 'Too many answers',
        answerOptions: [
          { answer: '1', correct: false },
          { answer: '2', correct: false },
          { answer: '3', correct: false },
          { answer: '4', correct: true },
          { answer: '5', correct: false },
          { answer: '6', correct: false },
          { answer: '7', correct: false }
        ]
      }
    ])('$description', ({ answerOptions }) => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: answerOptions,
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test.each([
      {
        description: 'No correct answers',
        answerOptions: [
          { answer: '3', correct: false },
          { answer: '5', correct: false }
        ]
      },
      {
        description: 'Duplicate answers',
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '4', correct: false }
        ]
      },
      {
        description: 'Answer too short',
        answerOptions: [
          { answer: '', correct: true },
          { answer: '5', correct: false }
        ]
      },
      {
        description: 'Answer too long',
        answerOptions: [
          { answer: 'A'.repeat(31), correct: true },
          { answer: '5', correct: false }
        ]
      }
    ])('$description', ({ answerOptions }) => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: answerOptions,
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      };

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    test.each([
      {
        description: 'Invalid thumbnail URL (no protocol)',
        thumbnailUrl: 'google.com/image.jpg'
      },
      {
        description: 'Invalid thumbnail URL (wrong extension)',
        thumbnailUrl: 'http://google.com/image.gif'
      },
      {
        description: 'Invalid thumbnail URL (empty)',
        thumbnailUrl: ''
      }
    ])('$description', ({ thumbnailUrl }) => {
      const questionBody = {
        question: 'What is 2 + 2?',
        timeLimit: 30,
        points: 5,
        answerOptions: [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        thumbnailUrl: thumbnailUrl,
      };

      const res = questionCreateHelper(quizId, userSession, questionBody);

      expect(res).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String)
      });
    });
  });
});
