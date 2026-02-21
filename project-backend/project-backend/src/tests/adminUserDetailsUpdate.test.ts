import { adminUserDetails } from '../auth';
import { clear } from '../other';
import { UserId, SessionId } from '../interface';
import { userDetailsUpdateHelper, authRegisterHelper } from './testHelper';
import { sessionToUserId } from '../helper';
const sampleData = {
  userData: [
    {
      userId: 0,
      email: 'ranivorous@gmail.com',
      password: 'Password2005!',
      nameFirst: 'Rani',
      nameLast: 'Jiang',
      numFailedPasswordsSinceLastLogin: 0,
      numSuccessfulLogins: 1,
      usedPassword: ['00AlreadyUsed', '11AlreadyUsed']
    },
    {
      userId: 1,
      email: 'testing@gmail.com',
      password: 'Password2005!',
      nameFirst: 'Hello',
      nameLast: 'World',
      numFailedPasswordsSinceLastLogin: 0,
      numSuccessfulLogins: 1,
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
    }],
  nextUserId: 2,
  nextQuizId: 2
};
const users: SessionId[] = [];
beforeAll(() => {
  clear();
});

describe('adminUserDetailsUpdate Validation Tests', () => {
  beforeAll(() => {
    sampleData.userData.forEach((user, index) => {
      const person = authRegisterHelper(user.email, user.password, user.nameFirst, user.nameLast);
      if ('error' in person) {
        console.log(person);

        throw new Error('Failed to add user');
      } else {
        users[index] = person;
      }
    });
  });
  const validEmail = 'test@gmail.com';
  const validFirstName = 'Fengxi';
  const validLastName = 'Zhang';
  describe('Successful Test', () => {
    test('Test successful adminUserDetailUpdate', () => {
      const test = userDetailsUpdateHelper(users[0].session, 'Email@gmail.com', 'Fengxi', 'Zhang');
      expect(test).toEqual({});
      const userId = sessionToUserId(users[0].session) as UserId;
      const data = adminUserDetails(userId.userId);
      expect(data).toEqual({
        user: {

          email: 'Email@gmail.com',
          name: 'Fengxi Zhang',
          numFailedPasswordsSinceLastLogin: 0,
          numSuccessfulLogins: 2,
          userId: userId.userId,
        }
      });
    });
  });

  describe('USER_ID Tests', () => {
    test('Not valid user', () => {
      const test = userDetailsUpdateHelper(users[0].session + 100,
        'anEmail@gmail.com', 'Fengxi', 'Zhang');
      expect(test).toEqual({
        error: 'UNAUTHORISED',
        message: expect.any(String)
      });
    });
  });

  describe('Email Tests', () => {
    test.each([
      ['anEmailgmail.com', 'Fengxi', 'Zhang'],
      ['testing@gmail.com', 'Fengxi', 'Zhang']
    ])('Invalid Email: %s', (email, firstName, lastName) => {
      const result = userDetailsUpdateHelper(users[0].session, email, firstName, lastName);
      expect(result).toEqual({
        error: 'INVALID_EMAIL',
        message: expect.any(String)
      });
    });
  });

  describe('Invalid First Name Tests', () => {
    test.each([
      [validEmail, '', validLastName],
      [validEmail, 'F', validLastName],
      [validEmail, 'Fengxiiiiiiiiiiiiiiiiiiii', validLastName],
      [validEmail, '!@#$%^&*()', validLastName],
    ])('should return INVALID_FIRST_NAME for firstName: %s',
      (email, firstName, lastName) => {
        const result = userDetailsUpdateHelper(users[0].session, email, firstName, lastName);
        expect(result).toEqual({
          error: 'INVALID_FIRST_NAME',
          message: expect.any(String),
        });
      });
  });

  describe('Invalid Last Name Tests', () => {
    test.each([
      [validEmail, validFirstName, ''],
      [validEmail, validFirstName, 'Z'],
      [validEmail, validFirstName, 'Zhanggggggggggggggggggggg'],
      [validEmail, validFirstName, '!@#$%^&*()'],
    ])('should return INVALID_LAST_NAME for lastName: %s', (email, firstName, lastName) => {
      const result = userDetailsUpdateHelper(users[0].session, email, firstName, lastName);
      expect(result).toEqual({
        error: 'INVALID_LAST_NAME',
        message: expect.any(String),
      });
    });
  });
});
