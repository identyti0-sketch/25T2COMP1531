import {
  gameStartHelper,
  quizCreateHelper,
  authRegisterHelper,
  clearHelper,
  questionCreateHelper
} from './testHelper';
import { Data, Error, SessionId } from '../interface';
import request from 'sync-request-curl';
import config from '../config.json';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Success Test
const sampleData: Data = {
  userData: [
    {
      userId: 0,
      email: 'ranivorous@gmail.com',
      password: 'Password2005!',
      nameFirst: 'Rani',
      nameLast: 'Jiang',
      numFailedPasswordsSinceLastLogin: 0,
      numSuccessfulLogins: 0,
      usedPassword: ['00AlreadyUsed', '11AlreadyUsed']
    },
    {
      userId: 1,
      email: 'testing@gmail.com',
      password: 'Password2005!',
      nameFirst: 'Hello',
      nameLast: 'World',
      numFailedPasswordsSinceLastLogin: 0,
      numSuccessfulLogins: 0,
      usedPassword: []
    }
  ],
  quizData: [
    {
      quizId: 0,
      creatorId: 0,
      description: 'lorum ipsum',
      name: 'linear algebra',
      timeCreated: 1683125870,
      timeLastEdited: 1683125871
    },
    {
      quizId: 1,
      creatorId: 1,
      description: 'testing adminQuizNameUpdate function',
      name: 'OldQuiz',
      timeCreated: 1683125870,
      timeLastEdited: 1683125871
    }
  ],
  nextUserId: 2,
  sessions: {},
  games: []
};
const sampleQuestion = [
  {
    questionBody: {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Jeffery Epstein',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    }
  },

  {
    questionBody: {
      question: 'Who is the best frenchman',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Charles de Gaul',
          correct: true
        },
        {
          answer: 'Philippe Pétain',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/charles.jpg'
    }
  }
];
const users: (SessionId)[] = [];
const quizzes: number[] = [];
beforeEach(() => {
  clearHelper();
});

describe('getGameStatatus Tests', () => {
  describe('Error Cases Empty Data', () => {
    test('User doesnt exist', () => {
      const result:Error = (gameStartHelper(1, '1', 3) as Error);
      expect(result).toEqual({
        error: 'UNAUTHORISED',
        message: expect.any(String),
      });
    });
  });
  describe('Error Cases With Only Users', () => {
    beforeEach(() => {
      sampleData.userData.forEach((x, i) => {
        const person = authRegisterHelper(x.email, x.password, x.nameFirst, x.nameLast);
        if ('session' in person) {
          users[i] = person;
        }
      });
    });

    test('Quiz doesnt exist', () => {
      const result: Error = (gameStartHelper(1, users[0].session, 3) as Error);
      expect(result).toEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String),
      });
    });
  });

  describe('Cases With Data', () => {
    beforeEach(() => {
      sampleData.userData.forEach((x, i) => {
        const person = authRegisterHelper(x.email, x.password, x.nameFirst, x.nameLast);
        if ('session' in person) {
          users[i] = person;
        }
      });
      sampleData.quizData.forEach((quiz, i) => {
        const q = quizCreateHelper(users[0].session, quiz.name, quiz.description);

        if ('quizId' in q) {
          quizzes[i] = q.quizId as number;
        }
      });
    });

    test('User doesnt exist', () => {
      const result = gameStartHelper(quizzes[0], users[0].session + '1', 5);
      expect(result).toEqual({
        error: 'UNAUTHORISED',
        message: expect.any(String),
      });
    });

    test('Quiz doesnt exist', () => {
      const result = gameStartHelper(quizzes[0] - 1, users[0].session, 5);
      expect(result).toEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String),
      });
    });

    test('Quiz doesnt belong to user', () => {
      const result = gameStartHelper(quizzes[0], users[1].session, 5);
      expect(result).toEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String),
      });
    });
  });

  describe(('With questions'), () => {
    beforeEach(() => {
      sampleData.userData.forEach((x, i) => {
        const person = authRegisterHelper(x.email, x.password, x.nameFirst, x.nameLast);
        if ('session' in person) {
          users[i] = person;
        }
      });
      sampleData.quizData.forEach((quiz, i) => {
        const q = quizCreateHelper(users[0].session, quiz.name, quiz.description);

        if ('quizId' in q) {
          quizzes[i] = q.quizId as number;
        }
      });
      questionCreateHelper(quizzes[0], users[0].session, sampleQuestion[0].questionBody);
    });

    test('Too many games', () => {
      for (let i = 0; i < 10; i++) {
        gameStartHelper(quizzes[0], users[0].session, 5);
      }
      const result = gameStartHelper(quizzes[0], users[0].session, 5);
      expect(result).toEqual({
        error: 'MAX_ACTIVATE_GAMES',
        message: expect.any(String),
      });
    });
  });
  test('Successful game start and game status fetch', () => {
    // Start the game
    const startRes = gameStartHelper(quizzes[0], users[0].session, 5);
    // const parsed = JSON.parse(startRes.toString());
    if ('gameId' in startRes) {
      const gameId = startRes.gameId;
      const quizId = quizzes[0];

      // Fetch game status
      const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
        headers: { session: users[0].session },
        timeout: TIMEOUT_MS
      });

      // Check HTTP status
      expect(res.statusCode).toBe(200);

      // Parse and check response structure
      const body = JSON.parse(res.getBody('utf8'));
      expect(body).toMatchObject({
        state: expect.any(String),
        atQuestion: expect.any(Number),
        players: expect.any(Array),
        metadata: {
          quizId: quizId,
          name: expect.any(String),
          description: expect.any(String),
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          numQuestions: expect.any(Number),
          questions: expect.any(Array),
          timeLimit: expect.any(Number),
          thumbnailUrl: expect.any(String)
        }
      });
    } else {
      // If startRes does not have a gameId, handle the error case here
      expect(startRes).toHaveProperty('error');
    }
  });
});
