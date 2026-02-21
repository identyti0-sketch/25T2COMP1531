import { Question } from '../interface';
import {
  clearHelper, quizCreateHelper, authRegisterHelper, quizInfoHelper,
  questionRemoveHelperV2, questionCreateHelper, gameStartHelper
} from './testHelper';
beforeEach(() => {
  clearHelper();
});
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

describe('No data', () => {
  test('Failure-no data', () => {
    const result = questionRemoveHelperV2(1, 1, '1');

    expect(result).toStrictEqual({ error: 'UNAUTHORISED', message: expect.any(String) });
  });
});
const users: string[] = [];
const quizzes: number[] = [];
describe('With Data', () => {
  beforeEach(async () => {
    let i = 0;
    for (const user of sampleData.userData) {
      const person = authRegisterHelper(user.email, user.password, user.nameFirst, user.nameLast);

      if ('session' in person) {
        users[i] = person.session;
      }
      i++;
    }
    i = 0;
    for (const quiz of sampleData.quizData) {
      const q = quizCreateHelper(users[0], quiz.name, quiz.description);

      if ('quizId' in q) {
        quizzes[i] = q.quizId as number;
      }
      i++;
    }
  });
  test('Invalid quiz ID', () => {
    const result = questionRemoveHelperV2(quizzes[0] - 1, 1, users[0]);
    expect(result).toEqual({
      error: 'INVALID_QUIZ_ID',
      message: expect.any(String)
    });
  });

  test('Unauthorised user', () => {
    const result = questionRemoveHelperV2(quizzes[0], 1, users[0] + '1');
    expect(result).toEqual({
      error: 'UNAUTHORISED',
      message: expect.any(String)
    });
  });

  test('Invalid question ID', () => {
    const result = questionRemoveHelperV2(quizzes[0], 1, users[0]);
    expect(result).toEqual({
      error: 'INVALID_QUESTION_ID',
      message: expect.any(String)
    });
  });

  describe('Single Question', () => {
    const question: number[] = [];
    beforeEach(() => {
      const q = questionCreateHelper(quizzes[0], users[0], sampleQuestion[0].questionBody);
      if ('questionId' in q) {
        question[0] = q.questionId as number;
      }
    });

    test('Invalid Question', () => {
      const result = questionRemoveHelperV2(quizzes[0], question[0] + 1, users[0]);
      expect(result).toEqual({
        error: 'INVALID_QUESTION_ID',
        message: expect.any(String)
      });
    });
    test('Success', () => {
      const result = questionRemoveHelperV2(quizzes[0], question[0], users[0]);
      expect(result).toEqual({});

      const quizResult = quizInfoHelper(users[0], quizzes[0]) as Question;
      if ('questions' in quizResult) {
        expect(quizResult.questions).toEqual([]);
      }
    });

    describe('Many Question', () => {
      beforeEach(() => {
        const q = questionCreateHelper(quizzes[0], users[0], sampleQuestion[1].questionBody);
        if ('questionId' in q) {
          question[1] = q.questionId as number;
        }
      });

      test('Invalid Question', () => {
        const result = questionRemoveHelperV2(quizzes[0], question[0] - 1, users[0]);
        expect(result).toEqual({
          error: 'INVALID_QUESTION_ID',
          message: expect.any(String)
        });
      });

      test('ACtive Game', () => {
        gameStartHelper(quizzes[0], users[0], 4);
        const result = questionRemoveHelperV2(quizzes[0], question[0], users[0]);
        expect(result).toEqual({
          error: 'ACTIVE_GAME_EXISTS',
          message: expect.any(String)
        });
      });

      test('Success', () => {
        const result = questionRemoveHelperV2(quizzes[0], question[0], users[0]);
        expect(result).toEqual({});

        const quizResult = quizInfoHelper(users[0], quizzes[0]) as Question;
        if ('questions' in quizResult) {
          expect(quizResult.questions).toEqual([{

            question: 'Who is the best frenchman',
            questionId: question[1],
            timeLimit: 4,
            points: 5,
            answerOptions: [
              {
                answer: 'Charles de Gaul',
                answerId: 1,
                correct: true
              },
              {
                answer: 'Philippe Pétain',
                answerId: 2,
                correct: false
              }
            ],
            thumbnailUrl: 'http://google.com/some/image/charles.jpg'

          }]);
        }
      });
    });
  });
});
