import {
  gameStartHelper,
  quizCreateHelper,
  authRegisterHelper,
  clearHelper,
  questionCreateHelper,
  playerJoinHelper,
  playerQuestionHelper,
  statusUpdateHelper,
  gameInfoHelper
}
  from './testHelper';
import { Data, SessionId, Player, Game } from '../interface';

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

describe('gameStart Tests', () => {
  describe(('With questions No PLayer'), () => {
    let player:Player;
    let game: number;
    let q: number;
    beforeEach(() => {
      sampleData.userData.forEach((user, i) => {
        const person = authRegisterHelper(user.email, user.password, user.nameFirst, user.nameLast);
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
      const res = questionCreateHelper(quizzes[0], users[0].session,
        sampleQuestion[0].questionBody);
      if ('questionId' in res) {
        q = res.questionId;
      }
      questionCreateHelper(quizzes[0], users[0].session, sampleQuestion[1].questionBody);
      const game1 = gameStartHelper(quizzes[0], users[0].session, 2);
      if ('gameId' in game1) {
        player = playerJoinHelper(game1.gameId, 'Fengxi');
        game = game1.gameId;
      }
    });

    test('Player doesnt exist', () => {
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;

      const result = playerQuestionHelper(player.playerId - 1, gameInfo.atQuestion);
      expect(result).toEqual({
        error: 'INVALID_PLAYER_ID',
        message: expect.any(String),
      });
    });

    test('Invalid Position', () => {
      statusUpdateHelper('NEXT_QUESTION', game, quizzes[0], users[0].session);
      statusUpdateHelper('SKIP_COUNTDOWN', game, quizzes[0], users[0].session);
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;
      const result = playerQuestionHelper(player.playerId, gameInfo.metadata.questions.length + 1);
      expect(result).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String),
      });
    });

    test('Successful Retrival', () => {
      statusUpdateHelper('NEXT_QUESTION', game, quizzes[0], users[0].session);
      statusUpdateHelper('SKIP_COUNTDOWN', game, quizzes[0], users[0].session);
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;

      const result = playerQuestionHelper(player.playerId, gameInfo.atQuestion);
      expect(result).toStrictEqual({

        question: 'Who is the Monarch of England?',
        questionId: q,
        timeLimit: 4,
        points: 5,
        answerOptions: [
          {
            answer: 'Prince Charles',
            answerId: 1,
            correct: true
          },
          {
            answer: 'Jeffery Epstein',
            answerId: 2,
            correct: true
          }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg'

      });
    });
    test('Wrong State, END', () => {
      statusUpdateHelper('END', game, quizzes[0], users[0].session);
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;
      const result = playerQuestionHelper(player.playerId, gameInfo.atQuestion);
      expect(result).toStrictEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });

    test('Wrong State, LOBBY', () => {
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;
      const result = playerQuestionHelper(player.playerId, gameInfo.atQuestion);
      expect(result).toStrictEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });

    test('Wrong State, QUESTION_COUNTDOWN', () => {
      statusUpdateHelper('NEXT_QUESTION', game, quizzes[0], users[0].session);
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;
      const result = playerQuestionHelper(player.playerId, gameInfo.atQuestion);
      expect(result).toStrictEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });

    test('Wrong State, FINAL_RESULTS', () => {
      statusUpdateHelper('NEXT_QUESTION', game, quizzes[0], users[0].session);
      statusUpdateHelper('ANSWER_SHOW', game, quizzes[0], users[0].session);
      statusUpdateHelper('GO_TO_FINAL_RESULTS', game, quizzes[0], users[0].session);
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;
      const result = playerQuestionHelper(player.playerId, gameInfo.atQuestion);
      expect(result).toStrictEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });
    test('Game not on this question', () => {
      statusUpdateHelper('NEXT_QUESTION', game, quizzes[0], users[0].session);
      statusUpdateHelper('SKIP_COUNTDOWN', game, quizzes[0], users[0].session);
      const gameInfo = gameInfoHelper(users[0].session, quizzes[0], game) as Game;
      const result = playerQuestionHelper(player.playerId, gameInfo.atQuestion + 1);
      expect(result).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String),
      });
    });
  });
});
