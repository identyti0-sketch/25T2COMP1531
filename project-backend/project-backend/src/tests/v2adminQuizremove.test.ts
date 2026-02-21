import {
  quizRemoveHelperV2,
  quizCreateHelper,
  quizInfoHelper,
  authRegisterHelper,
  clearHelper,
  gameStartHelper,
  questionCreateHelper
}
  from './testHelper';
import { Error, SessionId } from '../interface';

// Success Test
const sampleData = {
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
  games: {},
  sessions: {}
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

describe('adminQuizRemove Tests', () => {
  describe('Error Cases Empty Data', () => {
    test('User doesnt exist', () => {
      const result:Error = (quizRemoveHelperV2('1', 1) as Error);
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
      const result: Error = (quizRemoveHelperV2(users[0].session, 1) as Error);
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

    test('Successful quiz removal', () => {
      const success: object = quizRemoveHelperV2(users[0].session, quizzes[0]);
      expect(success).toStrictEqual({});
      const quiz = quizInfoHelper(users[0].session, quizzes[0]);
      expect(quiz).toStrictEqual({ error: 'INVALID_QUIZ_ID', message: expect.any(String) });
    });

    test('User doesnt exist', () => {
      const result = quizRemoveHelperV2(users[0].session + '1', quizzes[0]);
      expect(result).toEqual({
        error: 'UNAUTHORISED',
        message: expect.any(String),
      });
    });

    test('Quiz doesnt exist', () => {
      const result = quizRemoveHelperV2(users[0].session, quizzes[0] - 1);
      expect(result).toEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String),
      });
    });

    test('Quiz doesnt belong to user', () => {
      const result = quizRemoveHelperV2(users[1].session, quizzes[0]);
      expect(result).toEqual({
        error: 'INVALID_QUIZ_ID',
        message: expect.any(String),
      });
    });

    test('Game Exists', () => {
      questionCreateHelper(quizzes[0], users[0].session, sampleQuestion[0].questionBody);

      gameStartHelper(quizzes[0], users[0].session, 4);
      const result = quizRemoveHelperV2(users[0].session, quizzes[0]);
      expect(result).toEqual({
        error: 'ACTIVE_GAME_EXISTS',
        message: expect.any(String),
      });
    });
  });
});
