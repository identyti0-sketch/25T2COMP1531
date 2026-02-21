import crypto from 'crypto';
import { getData, getTimeout, saveData } from './dataStore';
import {
  SessionId, UserId, Error, Game, GamePlayer,
  Question, Answer, Rank, QuestionResult, Player
} from './interface';
import { clearTimeout } from 'timers';
// constants for magic numbers
const MIN_PWD_LEN = 8;
const MIN_NAME_LEN = 2;
const MAX_NAME_LEN = 20;
export const MILLISEC = 1000;
/**
 * Hashes password using sha256
 * @param {String} password
 * @returns {String}
 */
export function pwdHash(password: string): string {
  if (typeof password !== 'string') {
    return '';
  }
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Checks if password is invalid
 * @param {String} password
 * @returns {Boolean}
 */
export function pwdCheck(password: string): boolean {
  return (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || password.length < MIN_PWD_LEN);
}

/**
 * Checks if name is invalid
 * @param {String} name
 * @returns {Boolean}
 */
export function nameCheck(name: string): boolean {
  return (/[^a-zA-Z\s\-']/.test(name) || name.length > MAX_NAME_LEN || name.length < MIN_NAME_LEN);
}
/**
Checks is the user from userid and the user from quizid is the same
 * @param {number} userId
@param {number} quizId
 * @returns {Boolean}
*/
export function idCheck (userId:number, quizId:number): boolean {
  const data = getData();
  const quizUser = data.quizData.find(quiz => quiz.quizId === quizId);
  const userUser = data.userData.find(user => user.userId === userId);
  if (quizUser === undefined || userUser === undefined) {
    return false;
  }
  return quizUser.creatorId === userUser.userId;
}

export function sessionCreate(userId: number): SessionId {
  const sessions = getData().sessions;
  let id: string;
  do {
    id = (Math.floor(Math.random() * 100000000)).toString();
  } while (sessions[id] !== undefined);
  sessions[id] = userId;
  saveData();
  return { session: id };
}

export function sessionToUserId(sessionId: string): (UserId | Error) {
  const sessions = getData().sessions;

  const id = sessions[sessionId];
  if (id === undefined) {
    const err = {
      error: 'UNAUTHORISED',
      message: 'SessionId does not exist'
    };
    throw err;
  }
  return { userId: id };
}

export function matchErrorStatus(result: Error): number {
  switch (result.error) {
    case 'INVALID_CREDENTIALS':
    case 'INVALID_EMAIL':
    case 'INVALID_FIRST_NAME':
    case 'INVALID_LAST_NAME':
    case 'INVALID_PASSWORD':
    case 'INVALID_OLD_PASSWORD':
    case 'INVALID_NEW_PASSWORD':
    case 'INVALID_QUIZ_NAME':
    case 'DUPLICATE_QUIZ_NAME':
    case 'INVALID_DESCRIPTION':
    case 'INVALID_THUMBNAIL':
    case 'INVALID_QUESTION':
    case 'INVALID_ANSWERS':
    case 'INVALID_TIMELIMIT':
    case 'INVALID_PLAYER_NAME':
    case 'INVALID_PLAYER_ID':
    case 'INVALID_GAME_ID':
    case 'INCOMPATIBLE_GAME_STATE':
    case 'INVALID_QUESTION_ID':
    case 'INVALID_GAME':
    case 'MAX_ACTIVATE_GAMES':
    case 'QUIZ_IS_EMPTY':
    case 'INVALID_POSITION':
    case 'INVALID_ANSWER_IDS':
    case 'ACTIVE_GAME_EXISTS':
    case 'INVALID_ACTION':
      return 400; // Bad Request
    case 'UNAUTHORISED':
      return 401; // Unauthorized
    case 'INVALID_QUIZ_ID':
      return 403; // Forbidden
    case 'NOT_FOUND':
      return 404; // Not Found
    case 'CONFLICT':
      return 409; // Conflict
    default:
      return 500; // Internal Server Error
  }
}

export function ErrortoObj(result: string): Error {
  switch (result) {
    case 'INVALID_CREDENTIALS':
    case 'INVALID_EMAIL':
    case 'INVALID_FIRST_NAME':
    case 'INVALID_LAST_NAME':
    case 'INVALID_PASSWORD':
    case 'INVALID_OLD_PASSWORD':
    case 'INVALID_NEW_PASSWORD':
    case 'INVALID_QUIZ_NAME':
    case 'DUPLICATE_QUIZ_NAME':
    case 'INVALID_DESCRIPTION':
    case 'INVALID_THUMBNAIL':
    case 'INVALID_QUESTION':
    case 'INVALID_ANSWERS':
    case 'INVALID_TIMELIMIT':
    case 'INVALID_PLAYER_NAME':
    case 'INVALID_PLAYER_ID':
    case 'INVALID_GAME_ID':
    case 'INCOMPATIBLE_GAME_STATE':
    case 'INVALID_QUESTION_ID':
    case 'INVALID_GAME':
    case 'MAX_ACTIVATE_GAMES':
    case 'QUIZ_IS_EMPTY':
    case 'ACTIVE_GAME_EXISTS':
    case 'INVALID_POSITION':
      return { error: result, message: 'Client side issue' }; // Bad Request
    case 'UNAUTHORISED':
      return { error: result, message: 'Access not allowed' }; // Unauthorized
    case 'INVALID_QUIZ_ID':
      return { error: result, message: 'Forbidden' }; // Forbidden
    case 'NOT_FOUND':
      return { error: result, message: 'Not found' }; // Not Found
  }
}

export function isError(obj: unknown): obj is Error {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    'message' in obj &&
    typeof (obj).message === 'string'
  );
}

export function isValidThumbnailUrl(url: string): boolean {
  if (typeof url !== 'string' || !url) {
    return false;
  }

  const startsWithHttp = url.startsWith('http://') || url.startsWith('https://');
  const endsWithValidExtension = /\.(jpg|jpeg|png)$/i.test(url);

  return startsWithHttp && endsWithValidExtension;
}

export function isAlphanumericAndSpaces(str: string) {
  return /^[a-zA-Z0-9 ]*$/.test(str);
}

// gnerates a random player name if let blank that
// conforms to the structure "[5 letters][3 numbers]"
export function generateRandomName() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  let random = '';
  const availableLetters = letters.split('');

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * availableLetters.length);
    random += availableLetters.splice(randomIndex, 1);
  }

  const availableNumbers = numbers.split('');

  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    random += (availableNumbers.splice(randomIndex, 1)).toString();
  }

  return random;
}

export function checkValidMove(oldState: string, newAction: string, remainingQuestions: number) {
  if (newAction === 'END') return true;
  if (oldState === 'LOBBY' && newAction !== 'NEXT_QUESTION') return false;
  if (oldState === 'QUESTION_COUNTDOWN' && newAction !== 'SKIP_COUNTDOWN') return false;
  if (oldState === 'QUESTION_OPEN') {
    if (newAction !== 'GO_TO_ANSWER' && newAction !== 'END' &&
      newAction !== 'RECURZION') return false;
  }
  if (oldState === 'ANSWER_SHOW') {
    if ((newAction !== 'GO_TO_FINAL_RESULTS' && newAction !== 'NEXT_QUESTION') ||
      (newAction === 'NEXT_QUESTION' && remainingQuestions < 1)
    ) return false;
  }
  if (oldState === 'QUESTION_CLOSE') {
    if (newAction !== 'GO_TO_FINAL_RESULTS' && newAction !== 'NEXT_QUESTION' &&
      newAction !== 'GO_TO_ANSWER') return false;
  }
  if (oldState === 'FINAL_RESULTS' && newAction !== 'END') return false;
  return true;
}

/**
 * @param {Number} gameId
 * @returns {Game}
 */
export function findGame(id: number): Game | undefined {
  const allGames = Object.values(getData().games).flat();
  return allGames.find(game => game.gameId === id);
}

/**
 * @param {Number} playerId
 * @returns {Game}
 */
export function findPlayerAndGame(playerId: number): GamePlayer {
  const allGames = Object.values(getData().games).flat();
  const gamePlayer: GamePlayer = {
    player: undefined,
    game: undefined,
  };
  gamePlayer.game = allGames.find(game => {
    return game.players.some(player => {
      if (player.playerId === playerId) {
        gamePlayer.player = player;
        return true;
      }
      return false;
    });
  });
  if (gamePlayer.player === undefined) {
    const err = {
      error: 'INVALID_PLAYER_ID',
      message: 'player ID does not exist'
    };
    throw err;
  }
  return gamePlayer;
}

export function hasDupe(array: unknown[]) {
  const seen = new Set();
  return array.some(i => {
    if (seen.has(i)) {
      return true;
    } else {
      seen.add(i);
      return false;
    }
  });
}

export function validAnswer(array: number[], question: Question) {
  const error = 'INVALID_ANSWER_IDS';
  const someAnswerMissing = array.some(answerId => {
    return !question.answerOptions.some(option => {
      return option.answerId === answerId;
    });
  });
  if (someAnswerMissing) {
    const err = {
      error,
      message: 'Atleast one answer ID isn\'t valid'
    };
    throw err;
  }
  if (hasDupe(array)) {
    const err = {
      error,
      message: 'There are duplicate answers'
    };
    throw err;
  }
  if (array.length === 0) {
    const err = {
      error,
      message: 'No answers submitted'
    };
    throw err;
  }
}

export function checkCorrectness(submissions: number[], answers: Answer[]) {
  return !answers.some(answer => {
    const positive = submissions.includes(answer.answerId) ? 1 : -1;
    const truefalse = answer.correct ? 1 : -1;
    return !(positive * truefalse === 1);
  });
}

export function createTimeout(fn: () => void, gameId: number, time: number) {
  const timeouts = getTimeout();
  console.log('creating');
  console.log(timeouts);
  let err;
  timeouts[gameId] = setTimeout(() => {
    try {
      fn();
    } catch (e) {
      err = e;
    }
  }, time * MILLISEC);
  if (err !== undefined) {
    throw err;
  }
}

export function abortTimeout(gameId: number) {
  const timeouts = getTimeout();
  clearTimeout(timeouts[gameId]);
  delete getTimeout()[gameId];
  console.log(timeouts);
}

export function rankPlayers(game: Game) {
  const ranked: Rank[] = [];
  game.players.forEach(player => {
    let score = 0;
    game.questionResults.forEach((i, index) => {
      if (
        i.playerAnswers[player.playerId] !== undefined &&
        i.playerAnswers[player.playerId].isCorrect
      ) {
        score += game.metadata.questions[index].points;
      }
    });
    ranked.push({
      playerName: player.playerName,
      score,
    });
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

export function mapPlayerNameId(array: Player[]) {
  const playerMap: { [key: number] : string} = {};
  array.forEach(player => {
    playerMap[player.playerId] = player.playerName;
  });
  return playerMap;
}
export function correctPlayers(questionResult: QuestionResult, players: Player[]) {
  const correct: string[] = [];
  const playerMap = mapPlayerNameId(players);
  const ans = questionResult.playerAnswers;
  Object.keys(ans).forEach(id => {
    if (ans[parseInt(id)].isCorrect) {
      correct.push(playerMap[parseInt(id)]);
    }
  });
  return correct;
}
