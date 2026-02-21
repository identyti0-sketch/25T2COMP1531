import { QuizId, SessionId } from '../interface';
import {
  clearHelper, ERROR, expectToBe, authRegisterHelper,
  quizCreateHelper, userDetailsHelper,
  quizInfoHelper
} from './testHelper';

beforeEach(() => {
  clearHelper();
});

describe('clear tests', () => {
  test('clear Success - returns empty object', () => {
    expect(clearHelper()).toStrictEqual({});
  });

  test('clear Success - empties userData and quizData', () => {
    const user = authRegisterHelper('test@example.com', 'password123', 'Test', 'User') as SessionId;
    const quiz = quizCreateHelper(user.session, 'Test Quiz', 'A test quiz') as QuizId;

    clearHelper();

    expectToBe(userDetailsHelper, [user.session], ERROR('UNAUTHORISED'));
    const quizData = quizInfoHelper(user.session, quiz.quizId);
    expect(quizData).toStrictEqual({ error: 'UNAUTHORISED', message: expect.any(String) });
  });
});
