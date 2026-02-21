import { getData, getTimeout, saveData } from './dataStore';
import {
  Quiz, Data, Error as ApiError, QuizId,
  QuizNameId, Question, Answer, Game
} from './interface';
import {
  idCheck, isValidThumbnailUrl, checkValidMove, abortTimeout,
  createTimeout
} from './helper';

/**
 * Provide a list of all quizzes that are owned by the currently logged in user.
 * @param {number} userId
 * @returns {object} Contains quizId and name of quiz
 * @returns {number} quizId
 * @returns {string} name
 */
function adminQuizList(userId: number): {quizzes: QuizNameId[]}|ApiError {
  const data: Data = getData();

  // Check if user exists
  // Collect quizzes owned by user in an array
  const userQuizzes:{quizId:number, name:string}[] = [];
  for (const quiz of data.quizData) {
    if (quiz.creatorId === userId) {
      userQuizzes.push({
        quizId: quiz.quizId,
        name: quiz.name
      });
    }
  }
  saveData();
  return { quizzes: userQuizzes };
}

// helper for checking for valid quiz names
function isValidName (name: string):boolean {
  return /^[a-zA-Z0-9 ]+$/.test(name) && name.length >= 3 && name.length <= 30;
}

/**
 * Given basic details about a new quiz, create one for the logged in user.
 * @param {number} userId
 * @param {string} name
 * @param {string} description
 * @returns {object} contains quizId
 * @returns {number} quizId
 */
function adminQuizCreate(userId: number, name: string, description: string): ApiError|QuizId {
  // get the data struture
  const data: Data = getData();

  // error check if the user exists
  // use the helper to error check the quiz name
  if (!isValidName(name)) {
    saveData();
    return {
      error: 'INVALID_QUIZ_NAME',
      message: `Name must consist of alphanumeric characters and spaces only and must be 
                between 3 and 30 characters in length.`,
    };
  }

  // make sure the quiz name is unique as well
  for (const quiz of data.quizData) {
    if (quiz.creatorId === userId && quiz.name === name) {
      saveData();
      return {
        error: 'DUPLICATE_QUIZ_NAME',
        message: 'User already has a quiz with this same name.',
      };
    }
  }

  // error check the description length
  if (description.length > 100) {
    saveData();
    return {
      error: 'INVALID_DESCRIPTION',
      message: 'Description cannot exceed 100 characters in length.',
    };
  }

  // make a new quiz id and ensure that it is unique by checking it
  // against other quizzes the user has created
  let quizId: number;
  do {
    quizId = Math.floor(Math.random() * 1000000);
  } while (data.quizData.some(quiz => quiz.quizId === quizId));

  const newQuiz: Quiz = {
    quizId: quizId,
    creatorId: userId,
    name: name,
    description: description,
    timeCreated: Math.floor((Date.now()) / 1000),
    timeLastEdited: Math.floor((Date.now()) / 1000),
    questions: [],
    thumbnailUrl: ''
  };
  data.games[quizId] = [];
  data.quizData.push(newQuiz);
  saveData();
  return { quizId };
}

/**
 * Given a particular quiz, permanently remove the quiz.
 * @param {number} userId
 * @param {number} quizId
 * @returns
 */
function adminQuizRemove(userId: number, quizId: number): ApiError|object {
  // stub
  const data: Data = getData();
  const userIndex: number = data.userData.findIndex(x => x.userId === userId);
  const quizIndex: number = data.quizData.findIndex(x => x.quizId === quizId);
  if (quizIndex === -1) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }

  if (data.quizData[quizIndex].creatorId !== data.userData[userIndex].userId) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }
  // Remove the quiz
  data.quizData.splice(quizIndex, 1);
  saveData();
  return {}; // Success
}

export function adminQuizRemoveV2(userId: number, quizId: number): ApiError|object {
  // stub
  const data: Data = getData();
  const userIndex: number = data.userData.findIndex(x => x.userId === userId);
  const quizIndex: number = data.quizData.findIndex(x => x.quizId === quizId);
  if (quizIndex === -1) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }

  if (data.quizData[quizIndex].creatorId !== data.userData[userIndex].userId) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }
  for (const game of data.games[quizId]) {
    if (game.state !== 'END') {
      throw new Error('ACTIVE_GAME_EXISTS');
    }
  }

  // Remove the quiz
  data.quizData.splice(quizIndex, 1);
  saveData();
  return {}; // Success
}
/**
 * Get all of the relevant information about the current quiz.
 * @param {number} userId
 * @param {number} quizId
 * @returns {object} quiz
 */
function adminQuizInfo(userId: number, quizId: number):
    ApiError|Quiz {
  const data = getData();
  const quiz: Quiz = data.quizData.find(i => { return i.quizId === quizId; });
  if (quiz === undefined || quiz.creatorId !== userId) {
    saveData();
    const err = {
      error: 'INVALID_QUIZ_ID',
      message: 'Quiz ID does not refer to a valid quiz that this user owns.'
    };
    throw err;
  }
  const timeLimit = quiz.questions.reduce((total, question) => {
    return total + question.timeLimit;
  }, 0);
  saveData();
  return {
    quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: quiz.questions,
    timeLimit,
    thumbnailUrl: quiz.thumbnailUrl
  };
}

/**
 * Update the name of the relevant quiz.
 * @param {String} userId
 * @param {Number} quizId
 * @param {String} name
 * @returns
 */
function adminQuizNameUpdate(userId: number, quizId: number, name: string): ApiError|object {
  const data: Data = getData();
  const quizData: Quiz[] = data.quizData;

  const checks = [
    {
      check: quizData.some(i => i.quizId === quizId),
      returnObj: {
        error: 'INVALID_QUIZ_ID',
        message: 'Quiz ID does not refer to a valid quiz.'
      }
    },
    {
      check: idCheck(userId, quizId),
      returnObj: {
        error: 'INVALID_QUIZ_ID',
        message: 'Quiz ID does not refer to a quiz that this user owns.'
      }
    },
    {
      check: /^[a-zA-Z0-9 ]+$/.test(name),
      returnObj: {
        error: 'INVALID_QUIZ_NAME',
        message: 'Name contains invalid characters. Valid characters are alphanumeric and spaces.'
      }
    },
    {
      check: name.length >= 3 && name.length <= 30,
      returnObj: {
        error: 'INVALID_QUIZ_NAME',
        message: 'Name is either less than 3 characters long or more than 30 characters long.'
      }
    },
    {
      check: quizData.findIndex(quiz => quiz.name === name && quiz.creatorId === userId &&
        quiz.quizId !== quizId) === -1,
      returnObj: {
        error: 'DUPLICATE_QUIZ_NAME',
        message: 'Name is already used by the current logged in user for another quiz.'
      }
    }
  ];

  for (const i of checks) {
    if (i.check === false) {
      saveData();
      throw i.returnObj;
    }
  }

  // Update the name of the relevant quiz.
  const quizIndex: number = quizData.findIndex(quiz => quiz.quizId === quizId);
  quizData[quizIndex].name = name;
  quizData[quizIndex].timeLastEdited = Math.floor((Date.now()) / 1000);
  saveData();
  return {};
}

/**
 * Update the description of the relevant quiz.
 * @param {Number} userId
 * @param {Number} quizId
 * @param {String} description
 * @returns
 */
function adminQuizDescriptionUpdate(userId: number, quizId: number,
  description: string): ApiError|object {
  const data: Data = getData();

  // error check if the user exists
  // error check if the quiz exists
  const quiz: Quiz = data.quizData.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    saveData();
    const error: ApiError = {
      error: 'INVALID_QUIZ_ID',
      message: 'Quiz does not exist.',
    };
    throw error;
  }

  // error check whether the user owns the quiz
  if (quiz.creatorId !== userId) {
    saveData();
    const error: ApiError = {
      error: 'INVALID_QUIZ_ID',
      message: 'User does not own this quiz.',
    };
    throw error;
  }

  // error check the description length
  if (description.length > 100) {
    saveData();
    const error: ApiError = {
      error: 'INVALID_DESCRIPTION',
      message: 'Description cannot exceed 100 characters in length.',
    };
    throw error;
  }

  // update the description
  quiz.description = description;

  // update the time last edited
  quiz.timeLastEdited = Math.floor((Date.now()) / 1000);
  saveData();
  return {};
}

function adminQuizQuestionCreate(
  userId: number,
  quizId: number,
  questionBody: Question
): { questionId: number } | { error: string; message: string } {
  const data = getData();

  // Check if user exists
  // Check if quiz exists and user owns it
  const quiz = data.quizData.find(q => q.quizId === quizId);
  if (!quiz) {
    saveData();
    return {
      error: 'INVALID_QUIZ_ID',
      message: 'Quiz does not exist.'
    };
  }

  if (quiz.creatorId !== userId) {
    saveData();
    return {
      error: 'INVALID_QUIZ_ID',
      message: 'User does not own this quiz.'
    };
  }

  const { question, timeLimit, points, answerOptions, thumbnailUrl } = questionBody;

  // Valid question?
  if (!question || question.length < 5 || question.length > 50) {
    saveData();
    return {
      error: 'INVALID_QUESTION',
      message: 'Question must be between 5 and 50 characters.'
    };
  }
  const totalTime = quiz.questions.reduce((total, question) => {
    return total + question.timeLimit;
  }, 0);
  // Valid timeLimit?
  if (!timeLimit || timeLimit <= 0 || totalTime + timeLimit > 180) {
    saveData();
    return {
      error: 'INVALID_TIMELIMIT',
      message: 'Duration must be positive.'
    };
  }

  // Valid points?
  if (!points || points < 1 || points > 10) {
    saveData();
    return {
      error: 'INVALID_QUESTION',
      message: 'Points must be between 1 and 10.'
    };
  }

  // Valid answerOptions?
  if (!answerOptions || answerOptions.length < 2 || answerOptions.length > 6) {
    saveData();
    return {
      error: 'INVALID_ANSWERS',
      message: 'Must have between 2 and 6 answers.'
    };
  }

  // At least one correct answer
  const hasCorrectAnswer = answerOptions.some((answer: Answer) => answer.correct === true);
  if (!hasCorrectAnswer) {
    saveData();
    return {
      error: 'INVALID_ANSWERS',
      message: 'At least one answer must be correct.'
    };
  }

  // Duplicate answerOptions
  const answerTexts = answerOptions.map((answer: Answer) => answer.answer);
  const uniqueAnswers = new Set(answerTexts);
  if (answerTexts.length !== uniqueAnswers.size) {
    saveData();
    return {
      error: 'INVALID_ANSWERS',
      message: 'All answers must be unique.'
    };
  }

  // Validate each answer
  for (const answer of answerOptions) {
    if (!answer.answer || answer.answer.length < 1 || answer.answer.length > 30) {
      saveData();
      return {
        error: 'INVALID_ANSWERS',
        message: 'Each answer must be between 1 and 30 characters.'
      };
    }
  }
  if (!isValidThumbnailUrl(thumbnailUrl)) {
    saveData();
    return {
      error: 'INVALID_THUMBNAIL',
      message: 'the thumbnail url is invalid'
    };
  }
  let questionId: number;
  do {
    questionId = Math.floor(Math.random() * 1000000);
  } while (quiz.questions && quiz.questions.some(q => q.questionId === questionId));

  const answersWithIds = answerOptions.map((answer: Answer, index: number) => ({
    answerId: index + 1,
    answer: answer.answer,
    correct: answer.correct
  }));

  // Create new question
  const newQuestion = {
    questionId,
    question,
    timeLimit,
    points,
    answerOptions: answersWithIds,
    thumbnailUrl
  };

  // Initialize questions array if it doesn't exist
  if (!quiz.questions) {
    quiz.questions = [];
  }

  quiz.questions.push(newQuestion);
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  saveData();
  return { questionId };
}

function adminQuizQuestionUpdate(userId: number, quizId: number,
  questionId: number, quizQuestion: Question): ApiError | object {
  const data: Data = getData();
  let quizData: Quiz[] = data.quizData;
  const quiz = data.quizData.find(q => q.quizId === quizId);
  let totalTime;
  if (quiz !== undefined) {
    const quest = quiz.questions.find(q => q.questionId === questionId);
    if (quest !== undefined) {
      totalTime = quiz.questions.reduce((total, question) => {
        return total + question.timeLimit;
      }, 0) - quest.timeLimit + quizQuestion.timeLimit;
    }
  }
  const checks = [
    {
      check: quizData.some(i => i.quizId === quizId),
      returnObj: {
        error: 'INVALID_QUIZ_ID',
        message: 'Quiz ID does not refer to a valid quiz.'
      }
    },
    {
      check: idCheck(userId, quizId),
      returnObj: {
        error: 'INVALID_QUIZ_ID',
        message: 'Quiz ID does not refer to a quiz that this user owns.'
      }
    },
    {
      check: quizQuestion.question.length >= 5 && quizQuestion.question.length <= 50,
      returnObj: {
        error: 'INVALID_QUESTION',
        message: 'Question string is < 5 characters or > 50 characters in length'
      }
    },
    {
      check: quizQuestion.points >= 1 && quizQuestion.points <= 10,
      returnObj: {
        error: 'INVALID_QUESTION',
        message: 'The points awarded for the question are less than 1 or greater than 10'
      }
    },
    {
      check: quizQuestion.answerOptions.length >= 2 && quizQuestion.answerOptions.length <= 6,
      returnObj: {
        error: 'INVALID_ANSWERS',
        message: 'The question has more than 6 answers or less than 2 answers'
      }
    },
    {
      check: !(quizQuestion.answerOptions.some(option => option.answer.length < 1 ||
        option.answer.length > 30)),
      returnObj: {
        error: 'INVALID_ANSWERS',
        message: 'The length answer is shorter than 1 character or longer than 30 characters long'
      }
    },
    {
      check: quizQuestion.answerOptions.some(i => i.correct === true),
      returnObj: {
        error: 'INVALID_ANSWERS',
        message: 'There are no correct answers'
      }
    },
    {
      check: new Set(
        quizQuestion.answerOptions.map(a => a.answer.trim().toLowerCase())
      ).size === quizQuestion.answerOptions.length,
      returnObj: {
        error: 'INVALID_ANSWERS',
        message: 'Answer options contain duplicate answers'
      }
    },
    {
      check: quizQuestion.timeLimit > 0,
      returnObj: {
        error: 'INVALID_TIMELIMIT',
        message: 'The question timeLimit is not a positive number'
      }
    },
    {
      check: totalTime <= 180,
      returnObj: {
        error: 'INVALID_TIMELIMIT',
        message: 'The sum of the question timeLimits in the quiz exceeds 3 minutes'
      }
    },
    {
      check: quizQuestion.thumbnailUrl !== '',
      returnObj: {
        error: 'INVALID_THUMBNAIL',
        message: 'The thumbnailUrl is an empty string'
      }
    },
    {
      check: /\.(jpg|jpeg|png)$/i.test(quizQuestion.thumbnailUrl),
      returnObj: {
        error: 'INVALID_THUMBNAIL',
        message: 'ThumbnailUrl does not end with one of the following filetypes: jpg, jpeg, png'
      }
    },
    {
      check: quizQuestion.thumbnailUrl.startsWith('http://') ||
      quizQuestion.thumbnailUrl.startsWith('https://'),
      returnObj: {
        error: 'INVALID_THUMBNAIL',
        message: 'The thumbnailUrl does not begin with https: or http'
      }
    }
  ];

  for (const i of checks) {
    if (i.check === false) {
      throw i.returnObj;
    }
  }
  saveData();
  quizData = getData().quizData;

  // Update the name of the relevant quiz.
  const quizIndex: number = quizData.findIndex(quiz => quiz.quizId === quizId);
  // const questionArray = quizData[quizIndex].questions;
  const questionIndex: number = quizData[quizIndex].questions.findIndex(
    qs => qs.questionId === questionId);
  // preserve questionId

  quizData[quizIndex].questions[questionIndex] = quizQuestion;
  quizData[quizIndex].questions[questionIndex].question = quizQuestion.question;
  quizData[quizIndex].questions[questionIndex].timeLimit = quizQuestion.timeLimit;
  quizData[quizIndex].questions[questionIndex].points = quizQuestion.points;
  quizData[quizIndex].questions[questionIndex].answerOptions = quizQuestion.answerOptions;
  quizData[quizIndex].questions[questionIndex].thumbnailUrl = quizQuestion.thumbnailUrl;
  quizData[quizIndex].questions[questionIndex].questionId = questionId;
  quizData[quizIndex].questions[questionIndex].questionId = questionId;

  saveData();
  return {};
}

function adminQuizThumbnailUpdate(userId: number, quizId: number,
  thumbnailUrl: string): ApiError|object {
  const data: Data = getData();

  // error check if the user exists
  // error check if the quiz exists
  const quiz: Quiz = data.quizData.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    saveData();
    throw new Error(
      'INVALID_QUIZ_ID'
    );
  }

  // error check whether the user owns the quiz
  if (quiz.creatorId !== userId) {
    saveData();
    throw new Error(
      'INVALID_QUIZ_ID'
    );
  }

  // error check the url
  if (isValidThumbnailUrl(thumbnailUrl) !== true) {
    saveData();
    throw new Error(
      'INVALID_THUMBNAIL'
    );
  }

  // update the description
  quiz.thumbnailUrl = thumbnailUrl;

  // update the time last edited
  quiz.timeLastEdited = Math.floor((Date.now()) / 1000);
  saveData();
  return {};
}

function adminQuizQuestionRemove (userId: number,
  quizid: number,
  questionid: number): object|ApiError {
  const data = getData();
  // Check if user exists
  // Check if quiz exists and user owns it
  const quiz = data.quizData.find(q => q.quizId === quizid);
  if (!quiz) {
    saveData();
    throw new Error(
      'INVALID_QUIZ_ID'
    );
  }

  if (quiz.creatorId !== userId) {
    saveData();
    throw new Error(
      'INVALID_QUIZ_ID'
    );
  }
  const questionIndex = quiz.questions.findIndex(question => question.questionId === questionid);
  if (questionIndex === -1) {
    saveData();
    throw new Error(
      'INVALID_QUESTION_ID'
    );
  }

  quiz.questions.splice(questionIndex, 1);
  saveData();
  return {};
}

export function adminQuizQuestionRemoveV2 (userId: number,
  quizid: number,
  questionid: number): object|ApiError {
  const data = getData();
  // Check if user exists
  // Check if quiz exists and user owns it
  const quiz = data.quizData.find(q => q.quizId === quizid);
  if (!quiz) {
    saveData();
    throw new Error(
      'INVALID_QUIZ_ID'
    );
  }

  if (quiz.creatorId !== userId) {
    saveData();
    throw new Error(
      'INVALID_QUIZ_ID'
    );
  }

  const questionIndex = quiz.questions.findIndex(question => question.questionId === questionid);
  if (questionIndex === -1) {
    saveData();
    throw new Error(
      'INVALID_QUESTION_ID'
    );
  }

  for (const game of data.games[quizid]) {
    if (game.state !== 'END') {
      throw new Error(
        'ACTIVE_GAME_EXISTS'
      );
    }
  }

  quiz.questions.splice(questionIndex, 1);
  saveData();
  return {};
}

export function viewGames(userId: number, quizId: number) {
  const data = getData();
  const user = data.userData.find(u => u.userId === userId);
  if (!user) {
    saveData();
    const err = {
      error: 'UNAUTHORISED',
      message: 'user not found'
    };
    throw err;
  }

  // Check if quiz exists and user owns it
  const quiz = data.quizData.find(q => q.quizId === quizId);
  if (!quiz) {
    saveData();
    const err = {
      error: 'INVALID_QUIZ_ID',
      message: 'quiz not found'
    };
    throw err;
  }

  if (quiz.creatorId !== userId) {
    saveData();
    const err = {
      error: 'INVALID_QUIZ_ID',
      message: 'quiz is not owned by user'
    };
    throw err;
  }
  const activeGames: number[] = [];
  const inactiveGames: number[] = [];
  data.games[quizId].forEach(game => {
    if (game.state === 'END') {
      inactiveGames.push(game.gameId);
    } else {
      activeGames.push(game.gameId);
    }
  });
  activeGames.sort((a, b) => a - b);
  inactiveGames.sort((a, b) => a - b);
  return { activeGames, inactiveGames };
}

export function startGame (quizid: number, userid: number, autoStartNum: number):{gameId:number} {
  const data = getData();

  // Check if user exists
  // Check if quiz exists and user owns it
  const quiz = data.quizData.find(q => q.quizId === quizid);
  if (!quiz) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }

  if (quiz.creatorId !== userid) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }

  if (autoStartNum > 50) {
    saveData();
    throw new Error('INVALID_GAME');
  }

  const count = data.games[quizid].filter(game => game.state.localeCompare('END') !== 0).length;

  if (count >= 10) {
    saveData();
    throw new Error('MAX_ACTIVATE_GAMES');
  }

  if (quiz.questions === undefined || quiz.questions.length === 0) {
    saveData();
    throw new Error('QUIZ_IS_EMPTY');
  }
  const gameId = Math.floor(Math.random() * 1000000);
  const game: Game = {
    gameId: gameId,
    autoStartNum: autoStartNum,
    state: 'LOBBY',
    atQuestion: 0,
    players: [],
    metadata: structuredClone(quiz),
    questionResults: []
  };
  quiz.questions.forEach(question => {
    game.questionResults.push(
      {
        questionId: question.questionId,
        playersCorrect: [],
        playerAnswers: {},
        averageAnswerTime: 0,
        percentCorrect: 0
      }
    );
  });
  data.games[quizid].push(game);
  saveData();

  return { gameId: gameId };
}

export function getGameStatus(quizid: number, userid: number, gameid: number) {
  const data = getData();

  // Validate user
  // Validate quiz
  const quiz = data.quizData.find(q => q.quizId === quizid);
  if (!quiz) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }
  if (quiz.creatorId !== userid) {
    saveData();
    throw new Error('INVALID_QUIZ_ID');
  }

  // Validate game
  const gamesForQuiz = data.games[quiz.quizId] || [];
  const targetGame = gamesForQuiz.find(game => game.gameId === gameid);
  if (!targetGame) {
    saveData();
    throw new Error('INVALID_GAME_ID');
  }

  // Assemble metadata (reusing quiz object)
  const metadata: Quiz = {
    quizId: quiz.quizId,
    name: quiz.name,
    description: quiz.description,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    numQuestions: quiz.questions?.length,
    questions: quiz.questions,
    timeLimit: quiz.questions?.reduce((acc, q) => acc + q.timeLimit, 0),
    thumbnailUrl: quiz.thumbnailUrl
  };
  const playerList: string[] = [];
  targetGame.players.forEach(i => playerList.push(i.playerName));
  return {
    state: targetGame.state,
    atQuestion: targetGame.atQuestion,
    players: playerList,
    metadata
  };
}

export function gameStateUpdate(userId: number, quizid: number,
  gameId: number, state: string): ApiError | object {
  const data = getData();

  const quiz = data.quizData.find(q => q.quizId === quizid);
  if (!quiz) {
    saveData();
    const error: ApiError = { error: 'INVALID_QUIZ_ID', message: 'invalid quiz id' };
    throw error;
  }
  if (quiz.creatorId !== userId) {
    saveData();
    const error: ApiError = { error: 'INVALID_QUIZ_ID', message: 'invalid quiz id' };
    throw error;
  }

  const gamesForQuiz = data.games[quiz.quizId] || [];
  const targetGame = gamesForQuiz.find(game => game.gameId === gameId);
  if (!targetGame) {
    saveData();
    const error: ApiError = { error: 'INVALID_GAME_ID', message: 'invalid game it' };
    throw error;
  }

  if (state !== 'END' && state !== 'NEXT_QUESTION' && state !== 'SKIP_COUNTDOWN' &&
    state !== 'GO_TO_ANSWER' && state !== 'GO_TO_FINAL_RESULTS' && state !== 'RECURZION') {
    saveData();
    const error: ApiError = { error: 'INVALID_ACTION', message: 'invalid action' };
    throw error;
  }

  // check valid actions (miro)
  const oldState = targetGame.state;
  const check = checkValidMove(oldState, state,
    targetGame.metadata.questions.length - targetGame.atQuestion);
  if (!check) {
    saveData();
    const error: ApiError = { error: 'INCOMPATIBLE_GAME_STATE', message: 'invalid game state' };
    throw error;
  }

  // everything is good -> update the state based on action
  if (state === 'END') targetGame.state = 'END';
  if (state === 'NEXT_QUESTION') {
    targetGame.atQuestion++;
    targetGame.state = 'QUESTION_COUNTDOWN';
    createTimeout(() => {
      gameStateUpdate(userId, quizid, gameId, 'SKIP_COUNTDOWN');
    }, gameId, 3);
  }
  if (state === 'SKIP_COUNTDOWN') {
    targetGame.state = 'QUESTION_OPEN';
    abortTimeout(gameId);
    createTimeout(() => {
      gameStateUpdate(userId, quizid, gameId, 'RECURZION');
      delete getTimeout()[gameId];
    }, gameId, (quiz.questions)[targetGame.atQuestion - 1].timeLimit);
  }
  if (targetGame.state === 'QUESTION_OPEN' && state === 'GO_TO_ANSWER') {
    targetGame.state = 'ANSWER_SHOW';
    abortTimeout(gameId);
  }
  if (state === 'RECURZION') {
    targetGame.state = 'QUESTION_CLOSE';
  }
  if (state === 'GO_TO_ANSWER') targetGame.state = 'ANSWER_SHOW';
  if (state === 'GO_TO_FINAL_RESULTS') targetGame.state = 'FINAL_RESULTS';
  targetGame.timeSinceStateUpdate = Date.now() / 1000;
  saveData();
  return {};
}

export function playerQuestion (playerid: number, questionposition: number) {
  const data = getData();
  let finalPlayer;
  let finalGame;
  const arrayPos = questionposition - 1;
  console.log(questionposition);
  for (const quiz of data.quizData) {
    const games = data.games[quiz.quizId];
    for (const game of games) {
      const player = game.players.find(player => player.playerId === playerid);
      if (player !== undefined) {
        finalPlayer = player;
        finalGame = game;
      }
    }
  }

  if (finalPlayer === undefined) {
    throw new Error('INVALID_PLAYER_ID');
  }
  if (finalGame.state === 'LOBBY') {
    throw new Error('INCOMPATIBLE_GAME_STATE');
  }

  if (finalGame.state === 'QUESTION_COUNTDOWN') {
    throw new Error('INCOMPATIBLE_GAME_STATE');
  }

  if (finalGame.state === 'FINAL_RESULTS') {
    throw new Error('INCOMPATIBLE_GAME_STATE');
  }

  if (finalGame.state === 'END') {
    throw new Error('INCOMPATIBLE_GAME_STATE');
  }

  const question = finalGame.metadata.questions[arrayPos];

  if (question === undefined) {
    throw new Error('INVALID_POSITION');
  }

  if (finalGame.atQuestion !== questionposition) {
    throw new Error('INVALID_POSITION');
  }

  return finalGame.metadata.questions[arrayPos];
}

export {
  adminQuizNameUpdate,
  adminQuizList,
  adminQuizInfo,
  adminQuizRemove,
  adminQuizCreate,
  adminQuizDescriptionUpdate,
  adminQuizQuestionCreate,
  adminQuizQuestionUpdate,
  adminQuizThumbnailUpdate,
  adminQuizQuestionRemove
};
