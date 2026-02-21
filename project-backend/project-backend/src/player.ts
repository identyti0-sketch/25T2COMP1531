import { saveData, getData } from './dataStore';
import {
  checkCorrectness, findGame, findPlayerAndGame,
  generateRandomName, isAlphanumericAndSpaces, MILLISEC, validAnswer,
  sessionToUserId,
  createTimeout,
  rankPlayers,
  correctPlayers
} from './helper';
import { gameStateUpdate } from './quiz';

export function playerJoin(gameId: number, playerName: string) {
  const game = findGame(gameId);
  if (game === undefined) {
    saveData();
    const err = {
      error: 'INVALID_GAME_ID',
      message: 'Game Id does not refer to a valid game.'
    };
    throw err;
  }
  if (isAlphanumericAndSpaces(playerName) === false) {
    saveData();
    const err = {
      error: 'INVALID_PLAYER_NAME',
      message: 'Name contains invalid characters. Valid characters are alphanumeric and spaces.'
    };
    throw err;
  }
  if (game.players.some(i => { return i.playerName === playerName; })) {
    saveData();
    const err = {
      error: 'INVALID_PLAYER_NAME',
      message: 'Name of user entered is not unique compared to other users who have already joined'
    };
    throw err;
  }
  if (game.state !== 'LOBBY') {
    saveData();
    const err = {
      error: 'INCOMPATIBLE_GAME_STATE',
      message: 'Game is not in LOBBY state.'
    };
    throw err;
  }
  let playerId: number;
  do {
    playerId = Math.floor(Math.random() * 1000000);
  } while (game.players.some(i => { return i.playerId === playerId; }));
  if (playerName === '') {
    let genName: string;
    do {
      genName = generateRandomName();
    } while (game.players.some(i => { return i.playerName === genName; }));
    game.players.push({ playerName: genName, playerId });
  } else {
    game.players.push({ playerName, playerId });
  }
  if (game.players.length >= game.autoStartNum && game.autoStartNum !== 0) {
    game.state = 'QUESTION_COUNTDOWN';
    game.timeSinceStateUpdate = Date.now() / 1000;
    game.atQuestion = 1;
    createTimeout(() => {
      gameStateUpdate(game.metadata.creatorId, game.metadata.quizId,
        gameId, 'SKIP_COUNTDOWN'
      );
    }, gameId, 3);
  }
  saveData();
  return { playerId };
}

export function playerQuestionResults(playerId: number, questionPosition: number) {
  if (isNaN(playerId)) {
    saveData();
    const err = {
      error: 'INVALID_PLAYER_ID',
      message: 'Player ID must be a number'
    };
    throw err;
  }

  if (isNaN(questionPosition)) {
    saveData();
    const err = {
      error: 'INVALID_POSITION',
      message: 'Question position must be a number'
    };
    throw err;
  }

  const foundGame = findPlayerAndGame(playerId).game;

  if (!foundGame) {
    saveData();
    const err = {
      error: 'INVALID_PLAYER_ID',
      message: 'Player ID does not exist'
    };
    throw err;
  }

  if (foundGame.state !== 'ANSWER_SHOW') {
    saveData();
    const err = {
      error: 'INCOMPATIBLE_GAME_STATE',
      message: 'Game is not in ANSWER_SHOW state'
    };
    throw err;
  }

  const totalQuestions = foundGame.metadata.questions?.length || 0;
  if (questionPosition < 1 || questionPosition > totalQuestions) {
    saveData();
    const err = {
      error: 'INVALID_POSITION',
      message: 'Question position is not valid for this game'
    };
    throw err;
  }

  if (foundGame.atQuestion !== questionPosition) {
    saveData();
    const err = {
      error: 'INVALID_POSITION',
      message: 'Game is not currently on this question'
    };
    throw err;
  }

  if (!foundGame.questionResults) {
    foundGame.questionResults = foundGame.metadata.questions?.map(question => ({
      questionId: question.questionId,
      playersCorrect: [] as string[],
      playerAnswers: {},
      averageAnswerTime: 0,
      percentCorrect: 0
    })) || [];
  }

  const questionResult = foundGame.questionResults[questionPosition - 1];

  // Calculate players who answered correctly
  const playersCorrect: string[] = correctPlayers(questionResult, foundGame.players);

  console.log(playersCorrect);
  console.log(foundGame);
  // sort players alphabetically
  playersCorrect.sort();
  questionResult.playersCorrect = playersCorrect;

  // calc avg time
  let totalTime = 0;
  let answerCount = 0;
  for (const pid in questionResult.playerAnswers) {
    totalTime += Math.abs(questionResult.playerAnswers[pid].timeToAnswer);
    answerCount++;
  }
  questionResult.averageAnswerTime = answerCount > 0 ? Math.round(totalTime / answerCount) : 0;

  // calc % correct
  const totalPlayers = foundGame.players.length;
  questionResult.percentCorrect = totalPlayers > 0
    ? Math.round((playersCorrect.length / totalPlayers) * 100)
    : 0;

  saveData();
  return {
    questionId: questionResult.questionId,
    playersCorrect: questionResult.playersCorrect,
    averageAnswerTime: questionResult.averageAnswerTime,
    percentCorrect: questionResult.percentCorrect
  };
}

export function playerStatus(playerId: number) {
  const gamePlayer = findPlayerAndGame(playerId);
  const game = gamePlayer.game;
  return {
    state: game.state,
    numQuestions: game.metadata.questions.length,
    atQuestion: game.atQuestion
  };
}

export function playerSubmission(answerIds: number[], playerId: number, questionPosition: number) {
  const gamePlayer = findPlayerAndGame(playerId);
  const game = gamePlayer.game;
  if (game.atQuestion !== questionPosition) {
    const err = {
      error: 'INVALID_POSITION',
      message: 'The game is not in specified position!'
    };
    throw err;
  }
  if (game.state !== 'QUESTION_OPEN') {
    const err = {
      error: 'INCOMPATIBLE_GAME_STATE',
      message: 'Game is not in QUESTION_OPEN state!'
    };
    throw err;
  }
  const question = game.metadata.questions[questionPosition - 1];
  validAnswer(answerIds, question);
  const isCorrect = checkCorrectness(answerIds, question.answerOptions);
  const playerAnswer = {
    answerIds,
    timeToAnswer: -(game.timeSinceStateUpdate) + Date.now() / MILLISEC,
    isCorrect,
    pointsEarned: question.points
  };
  game.questionResults[questionPosition - 1].playerAnswers[playerId] = playerAnswer;
  saveData();
  return {};
}

export function getGameResults(quizId: number, gameId: number, session: string) {
  const data = getData();

  const userId = sessionToUserId(session);
  if (!userId || (typeof userId === 'object' && 'error' in userId)) {
    saveData();
    const err = {
      error: 'UNAUTHORISED',
      message: 'Session is empty or invalid.'
    };
    throw err;
  }

  const quiz = data.quizData.find(q => q.quizId === quizId);
  if (!quiz || quiz.creatorId !== userId.userId) {
    saveData();
    const err = {
      error: 'INVALID_QUIZ_ID',
      message: 'Quiz ID does not refer to a valid quiz or user does not own this quiz.'
    };
    throw err;
  }

  const gamesForQuiz = data.games[quizId];
  const game = gamesForQuiz?.find(g => g.gameId === gameId);
  if (!game) {
    saveData();
    const err = {
      error: 'INVALID_GAME_ID',
      message: 'Game ID does not refer to a valid game within this quiz.'
    };
    throw err;
  }

  if (game.state !== 'FINAL_RESULTS') {
    saveData();
    const err = {
      error: 'INCOMPATIBLE_GAME_STATE',
      message: 'Game is not in FINAL_RESULTS state.'
    };
    throw err;
  }
  // calc users ranked by score
  const usersRankedByScore = rankPlayers(game);
  // calc question results
  const questionResults = game.questionResults?.map(result => {
    const totalPlayers = game.players.length;
    const correctPlayers = result.playersCorrect.length;

    // calc %
    const percentCorrect = totalPlayers > 0
      ? Math.round((correctPlayers / totalPlayers) * 100)
      : 0;

    // calc avgtime
    const totalAnswerTime = Object.values(result.playerAnswers || {}).reduce((sum, answer) => {
      return sum + (answer as { timeToAnswer: number }).timeToAnswer;
    }, 0);
    const averageAnswerTime = correctPlayers > 0
      ? Math.round(totalAnswerTime / correctPlayers)
      : 0;

    return {
      questionId: result.questionId,
      playersCorrect: result.playersCorrect,
      averageAnswerTime,
      percentCorrect
    };
  }) || [];

  saveData();
  return { usersRankedByScore, questionResults };
}

export function playerResults(playerId: number) {
  const data = getData();

  console.log(data);
  const foundGame = findPlayerAndGame(playerId).game;

  if (foundGame.state !== 'FINAL_RESULTS') {
    saveData();
    const err = {
      error: 'INCOMPATIBLE_GAME_STATE',
      message: 'Game is not in FINAL_RESULTS state'
    };
    throw err;
  }

  if (!foundGame.questionResults) {
    foundGame.questionResults = foundGame.metadata.questions?.map(question => ({
      questionId: question.questionId,
      playersCorrect: [] as string[],
      playerAnswers: {},
      averageAnswerTime: 0,
      percentCorrect: 0
    })) || [];
  }

  // Calc rank
  const usersRankedByScore = rankPlayers(foundGame);
  const questionResults = foundGame.questionResults?.map(result => {
    const totalPlayers = foundGame.players.length;
    const correctPlayers = result.playersCorrect.length;

    // calc percentage
    const percentCorrect = totalPlayers > 0
      ? Math.round((correctPlayers / totalPlayers) * 100)
      : 0;

    // calc avg time
    const totalAnswerTime = Object.values(result.playerAnswers || {}).reduce((sum, answer) => {
      return sum + (answer as { timeToAnswer: number }).timeToAnswer;
    }, 0);
    const averageAnswerTime = correctPlayers > 0
      ? Math.round(totalAnswerTime / correctPlayers)
      : 0;

    return {
      questionId: result.questionId,
      playersCorrect: result.playersCorrect,
      averageAnswerTime,
      percentCorrect
    };
  }) || [];

  saveData();
  return { usersRankedByScore, questionResults };
}
