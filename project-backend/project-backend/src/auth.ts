import { getData, saveData } from './dataStore';
import validator from 'validator';
import { pwdCheck, pwdHash, nameCheck } from './helper';
import { User, Error, UserId } from './interface';
/**
 * Register a user with an email, password, and names, then return their userId value.
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {object} contains userId
 * @returns {number} userId
 */
function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string):
(Error | UserId) {
  const data = getData();

  const userData = data.userData;

  const checks = [
    {
      check: userData.some((i) => { return i.email === email; }),
      returnObj: {
        error: 'INVALID_EMAIL',
        message: 'Email address is used by another user.'
      }
    },
    {
      check: validator.isEmail(email) === false,
      returnObj: {
        error: 'INVALID_EMAIL',
        message: 'Email is invalid.'
      }
    },
    {
      check: (nameCheck(nameFirst)),
      returnObj: {
        error: 'INVALID_FIRST_NAME',
        message: 'nameFirst contains invalid characters or is of invalid length.'
      }
    },
    {
      check: nameCheck(nameLast),
      returnObj: {
        error: 'INVALID_LAST_NAME',
        message: 'nameLast contains invalid characters or of invalid length.'
      }
    },
    {
      check: (pwdCheck(password)),
      returnObj: {
        error: 'INVALID_PASSWORD',
        message: 'password does not contain number(s) and letter(s) and is of valid length.'
      }
    }
  ];

  // check for error
  for (const i of checks) {
    if (i.check) {
      saveData();
      throw i.returnObj;
    }
  }

  userData.push(
    {
      userId: data.nextUserId,
      email: email,
      password: pwdHash(password),
      nameFirst: nameFirst,
      nameLast: nameLast,
      numFailedPasswordsSinceLastLogin: 0,
      numSuccessfulLogins: 1,
      usedPassword: []
    }
  );

  data.nextUserId++;
  saveData();
  return {
    userId: (data.nextUserId - 1)
  };
}

/**
 * Given a registered user's email and password, return their userId value.
 * @param {string} email
 * @param {string} password
 * @returns {object} contains userId
 * @returns {number} userId
 */
function adminAuthLogin(email: string, password: string): (Error | UserId) {
  const userData = getData().userData;

  const user = userData.find(i => { return email === i.email; });
  if (user === undefined) {
    saveData();
    const err: Error = {
      error: 'INVALID_CREDENTIALS',
      message: 'Email address does not exist.'
    };
    throw err;
  }

  if (pwdHash(password) !== user.password) {
    user.numFailedPasswordsSinceLastLogin++;
    saveData();

    const err = {
      error: 'INVALID_CREDENTIALS',
      message: 'password is not correct for the given email.'
    };
    throw err;
  }
  user.numFailedPasswordsSinceLastLogin = 0;
  user.numSuccessfulLogins++;

  saveData();
  return {
    userId: user.userId
  };
}
/**
 *
 * @param sessionId
 * @returns {} if successful
 * @returns {Error} if failed
 */
function adminAuthLogout(sessionId: string): (Error | Record<string, never>) {
  const sessions = getData().sessions;
  if (sessions[sessionId] === undefined) {
    saveData();
    const err = {
      error: 'UNAUTHORISED',
      message: 'Session id does not refer to a logged in user'
    };
    throw err;
  }
  delete sessions[sessionId];
  saveData();
  return {};
}
/**
 * Given an admin user's userId, return details about the user
 * "name" is the first and last name concatenated with a single space between them.
 * @param {number} userId
 * @returns {object} user
 */

function adminUserDetails(userId: number): (Error | {user: User}) {
  const user = getData().userData.find(i => {
    return i.userId === userId;
  });
  saveData();
  return {
    user:
    {
      userId: user.userId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Given an admin user's userId and a set of properties,
 *  update the properties of this logged in admin user.
 * @param {Number} userId
 * @param {String} email
 * @param {String} nameFirst
 * @param {String} nameLast
 * @returns
 */
function adminUserDetailsUpdate(userId: number, email: string, nameFirst: string, nameLast: string):
(Error | Record<string, never>) {
  const data = getData();
  const userData = data.userData;
  const userIndex = userData.find(x => x.userId === userId);
  if (validator.isEmail(email) === false) {
    saveData();
    const err = { error: 'INVALID_EMAIL', message: 'Invalid Email' };
    throw err;
  }

  if (nameCheck(nameFirst) === true) {
    saveData();
    const err = {
      error: 'INVALID_FIRST_NAME',
      message: 'nameFirst is of invalid length, or contains invalid characters.',
    };
    throw err;
  }

  if (nameCheck(nameLast) === true) {
    saveData();
    const err = {
      error: 'INVALID_LAST_NAME',
      message: 'nameLast is of invalid lengt, or contains invalid characters.',
    };
    throw err;
  }

  if (userData.some(x => x.userId !== userId && x.email === email) === true) {
    saveData();
    const err = { error: 'INVALID_EMAIL', message: 'Email already taken' };
    throw err;
  }

  userIndex.nameFirst = nameFirst;
  userIndex.nameLast = nameLast;
  userIndex.email = email;
  userIndex.numSuccessfulLogins++;
  saveData();
  return {}; // Success empty object
}

/**
 * Given details relating to a password change, update the password of a logged in user.
 * @param {Number} userId
 * @param {String} oldPassword
 * @param {String} newPassword
 * @returns
 */
function adminUserPasswordUpdate(userId: number, oldPassword: string, newPassword: string):
(Error | Record<string, never>) {
  const data = getData();
  const userData = data.userData;
  const theUser = userData.find(i => { return i.userId === userId; });

  const hashOld = pwdHash(oldPassword);
  const hashNew = pwdHash(newPassword);

  if (theUser.password !== hashOld) {
    saveData();
    const err: Error = {
      error: 'INVALID_OLD_PASSWORD',
      message: 'Old Password is not the correct old password'
    };
    throw err;
  }
  if (oldPassword === newPassword) {
    saveData();
    const err: Error = {
      error: 'INVALID_NEW_PASSWORD',
      message: 'Old Password and New Password match exactly'
    };
    throw err;
  }
  if (theUser.usedPassword.includes(hashNew)) {
    saveData();
    const err: Error = {
      error: 'INVALID_NEW_PASSWORD',
      message: 'New Password has already been used before by this user'
    };
    throw err;
  }
  if (pwdCheck(newPassword)) {
    saveData();
    const err: Error = {
      error: 'INVALID_NEW_PASSWORD',
      message: 'New Password does not contain letter(s) and number(s) or isn\'t of valid length'
    };
    throw err;
  }

  // all good
  theUser.usedPassword.push(hashOld);
  theUser.password = hashNew;
  saveData();
  return {};
}

export {
  adminAuthRegister,
  adminAuthLogin,
  adminAuthLogout,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate
};
