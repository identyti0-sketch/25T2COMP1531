import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import {
  adminAuthLogin, adminAuthLogout, adminUserDetails, adminUserPasswordUpdate,
  adminUserDetailsUpdate
} from './auth';
import {
  adminQuizNameUpdate, adminQuizDescriptionUpdate, adminQuizCreate,
  adminQuizList, adminQuizQuestionCreate, adminQuizQuestionUpdate,
  adminQuizInfo, adminQuizRemove, adminQuizThumbnailUpdate,
  adminQuizQuestionRemove, startGame, adminQuizRemoveV2, adminQuizQuestionRemoveV2, getGameStatus,
  playerQuestion, gameStateUpdate,
  viewGames

} from './quiz';
import { sessionCreate, sessionToUserId, matchErrorStatus, ErrortoObj } from './helper';
import { UserId } from './interface';
import { adminAuthRegister } from './auth';
import { clear } from './other';
import {
  getGameResults,
  playerJoin, playerQuestionResults, playerResults, playerStatus, playerSubmission,
} from './player';
// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));

// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use(
  '/docs',
  sui.serve,
  sui.setup(
    YAML.parse(file),
    { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }
  )
);

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

const dataFile = './data.json';
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync('data.json', JSON.stringify({
    userData: [],
    quizData: [],
    sessions: {},
    nextUserId: 0
  }, null, 2), 'utf-8');
}
// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);

  if ('error' in result && result.error === 'INVALID_ECHO') {
    return res.status(400).json(result);
  }

  return res.json(result);
});

// TODO

// Register request (POST)
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  let result;
  try {
    result = adminAuthRegister(email, password, nameFirst, nameLast);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(sessionCreate((result as UserId).userId));
});

// Login request (POST)
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  let result;
  try {
    result = adminAuthLogin(email, password);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(sessionCreate((result as UserId).userId));
});

// Logout request (POST)
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const sessionId = (req.headers.session as string);
  let result;
  try {
    result = adminAuthLogout(sessionId);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(result);
});

// Get user details request (GET)
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  // stub
  // const sessionId = req.headers.session;
  const sessionId = (req.headers.session as string);
  let userId;
  try {
    userId = (sessionToUserId(sessionId));
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  let result;
  try {
    result = adminUserDetails((userId as UserId).userId);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(result);
});
// Update User Details (PUTS)
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  // stub
  // const sessionId = req.headers.session;
  const sessionId = req.headers.session;
  let userId: UserId;
  try {
    userId = sessionToUserId(sessionId as string) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const { email, nameFirst, nameLast } = req.body;
  try {
    const result = adminUserDetailsUpdate(userId.userId, email, nameFirst, nameLast);
    res.status(200).json(result);
  } catch (err) {
    // const error = ErrortoObj (err.error);
    // console.log (err);
    res.status(matchErrorStatus(err)).json(err);
  }
});

// Update password (PUTS)
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const session = req.get('session');
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const { oldPassword, newPassword } = req.body;
  try {
    const result = adminUserPasswordUpdate(userIdResult.userId, oldPassword, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(matchErrorStatus(error)).json(error);
  }
});

// Get all quizzes owned by user (GET)
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const session = req.get('session');
  let userIdResult: UserId;
  try {
    userIdResult = sessionToUserId(session as string) as UserId;
  } catch (err) {
    return res.status(matchErrorStatus(err)).json(err);
  }

  let result;
  try {
    result = adminQuizList(userIdResult.userId);
  } catch (err) {
    return res.status(matchErrorStatus(err)).json(err);
  }

  if ('error' in result) {
    return res.status(matchErrorStatus(result)).json(result);
  }
  return res.status(200).json(result);
});

app.post('/v1/admin/quiz/:quizid/game/start', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizid);
  const session = req.headers.session as string | undefined;
  const autoStartNum = req.body.autoStartNum;
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  let result;
  try {
    result = startGame(quizid, userIdResult.userId, autoStartNum);
  } catch (err) {
    const error = ErrortoObj(err.message);
    res.status(matchErrorStatus(error)).json(error);
    return;
  }

  res.status(200).json(result);
});
// Create Quiz (POST)
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const session = req.get('session');
  let userIdResult: UserId;
  try {
    userIdResult = sessionToUserId(session as string) as UserId;
  } catch (err) {
    return res.status(matchErrorStatus(err)).json(err);
  }

  const { name, description } = req.body;
  if (name === undefined) {
    return res.status(400).json({ error: 'INVALID_QUIZ_NAME', message: 'Name field is required' });
  }
  if (description === undefined) {
    return res.status(400).json({
      error: 'INVALID_DESCRIPTION',
      message: 'Description field is required'
    });
  }

  let result;
  try {
    result = adminQuizCreate(userIdResult.userId, name, description);
  } catch (err) {
    return res.status(matchErrorStatus(err)).json(err);
  }

  if ('error' in result) {
    return res.status(matchErrorStatus(result)).json(result);
  }
  return res.status(200).json(result);
});

// Delete Quiz (DELETE)
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const sessionId = req.headers.session;
  let userId;
  try {
    userId = sessionToUserId(sessionId as string) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizid = parseInt(req.params.quizid);
  let result;
  try {
    result = adminQuizRemove(userId.userId, quizid);
    res.status(200).json(result);
  } catch (err) {
    const error = ErrortoObj(err.message);
    res.status(matchErrorStatus(error)).json(error);
  }
});

app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const sessionId = req.headers.session;
  let userId;
  try {
    userId = sessionToUserId(sessionId as string) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizid = parseInt(req.params.quizid);
  try {
    const result = adminQuizRemoveV2(userId.userId, quizid);
    res.status(200).json(result);
  } catch (err) {
    const error = ErrortoObj(err.message);
    res.status(matchErrorStatus(error)).json(error);
  }
});

// Update Quiz (PUTS)
app.put('/v1/admin/quiz/:quizId/name', (req: Request, res: Response) => {
  const session = req.get('session');
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session as string) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizId = parseInt(req.params.quizId);
  const { name } = req.body;

  try {
    const result = adminQuizNameUpdate(userIdResult.userId, quizId, name);
    res.status(200).json(result);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
  }
});

// Update Quiz Description (PUTS)
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const session = (req.get('session'));
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizid = parseInt(req.params.quizid);
  const { description } = req.body;

  try {
    const result = adminQuizDescriptionUpdate(userIdResult.userId, quizid, description);
    res.status(200).json(result);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
  }
});

// Quiz info (GET)
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  // stub
  // const sessionId = req.headers.session;
  let userId;
  try {
    userId = sessionToUserId(req.headers.session as string);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizId = parseInt(req.params.quizid as string);
  let result;
  try {
    result = adminQuizInfo((userId as UserId).userId, quizId);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(result);
});
// Reset dataStore (DELETE)
app.delete('/v1/clear', (req: Request, res: Response) => {
  const resp = clear();
  res.status(200).json(resp);
});

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const session = (req.get('session'));
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizid = parseInt(req.params.quizid);
  const { thumbnailUrl } = req.body;
  try {
    const result = adminQuizThumbnailUpdate(userIdResult.userId, quizid, thumbnailUrl);
    res.status(200).json(result);
  } catch (err) {
    const error = ErrortoObj(err.message);
    res.status(matchErrorStatus(error)).json(error);
  }
});

app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const session = req.get('session');
  let userIdResult: UserId;
  try {
    userIdResult = sessionToUserId(session as string) as UserId;
  } catch (err) {
    return res.status(matchErrorStatus(err)).json(err);
  }

  const quizId = parseInt(req.params.quizid);
  const { questionBody } = req.body;

  let result;
  try {
    result = adminQuizQuestionCreate(userIdResult.userId, quizId, questionBody);
  } catch (err) {
    return res.status(matchErrorStatus(err)).json(err);
  }

  if ('error' in result) {
    return res.status(matchErrorStatus(result)).json(result);
  }
  return res.status(200).json(result);
});

app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const session = (req.get('session'));
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);
  const newQuestion = req.body.questionBody;
  try {
    const result = adminQuizQuestionUpdate(userIdResult.userId, quizid, questionid, newQuestion);
    res.status(200).json(result);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
  }
});

app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const session = req.headers.session as string | undefined;
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);
  try {
    const result = adminQuizQuestionRemove(userIdResult.userId, quizid, questionid);
    res.status(200).json(result);
  } catch (err) {
    const error = ErrortoObj(err.message);
    res.status(matchErrorStatus(error)).json(error);
  }
});

app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const session = req.headers.session as string | undefined;
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);
  try {
    const result = adminQuizQuestionRemoveV2(userIdResult.userId, quizid, questionid);
    res.status(200).json(result);
  } catch (err) {
    const error = ErrortoObj(err.message);
    res.status(matchErrorStatus(error)).json(error);
  }
});

app.get('/v1/admin/quiz/:quizid/games', (req: Request, res: Response) => {
  // stub
  // const sessionId = req.headers.session;
  const sessionId = (req.headers.session as string);
  const quizId = parseInt(req.params.quizid as string);
  let userId;
  try {
    userId = (sessionToUserId(sessionId));
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  let result;
  try {
    result = viewGames((userId as UserId).userId, quizId);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(result);
});

app.put('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  let userIdResult;
  // check session id
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }

  // get game & quiz ids
  const quizid = parseInt(req.params.quizid);
  const gameid = parseInt(req.params.gameid);
  const newAction = req.body.action as string;

  let result;
  try {
    result = gameStateUpdate(userIdResult.userId, quizid, gameid, newAction);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(result);
});

// get game status
app.get('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  // check userId (session)
  const session = req.headers.session as string | undefined;
  let userIdResult;
  try {
    userIdResult = sessionToUserId(session) as UserId;
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }

  // check quizId
  const quizid = parseInt(req.params.quizid);
  const gameid = parseInt(req.params.gameid);

  try {
    const result = getGameStatus(quizid, userIdResult.userId, gameid);
    res.status(200).json(result);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
  }
});

app.get('/v1/admin/quiz/:quizid/game/:gameid/results', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const gameId = parseInt(req.params.gameid);
  const session = req.headers.session as string;

  try {
    const result = getGameResults(quizId, gameId, session);
    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { error: string; message: string };
    res.status(matchErrorStatus(error)).json(error);
  }
});

// Allow player to join games
app.post('/v1/player/join', (req: Request, res: Response) => {
  const gameId = parseInt(req.body.gameId as string);
  const playerName = req.body.playerName as string;
  let result;
  try {
    result = playerJoin(gameId, playerName);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(result);
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid as string);
  let result;
  try {
    result = playerStatus(playerId);
  } catch (err) {
    res.status(matchErrorStatus(err)).json(err);
    return;
  }
  res.status(200).json(result);
});

app.get('/v1/player/:playerid/question/:questionposition',
  (req: Request, res: Response) => {
    const playerId = parseInt(req.params.playerid);
    const questionPosition = parseInt(req.params.questionposition);

    let result;
    try {
      result = playerQuestion(playerId, questionPosition);
    } catch (err) {
      const error = ErrortoObj(err.message);
      res.status(matchErrorStatus(error)).json(error);
      return;
    }
    res.status(200).json(result);
  });

app.put('/v1/player/:playerid/question/:questionposition/answer',
  (req: Request, res: Response) => {
    const playerId = parseInt(req.params.playerid as string);
    const questionPosition = parseInt(req.params.questionposition as string);
    console.log(questionPosition);
    const answerIds: number[] = req.body.answerIds;
    let result;
    try {
      result = playerSubmission(answerIds, playerId, questionPosition);
    } catch (err) {
      res.status(matchErrorStatus(err)).json(err);
      return;
    }
    res.status(200).json(result);
  });

app.get('/v1/player/:playerid/question/:questionposition/results',
  (req: Request, res: Response) => {
    const playerId = parseInt(req.params.playerid);
    const questionPosition = parseInt(req.params.questionposition);

    let result;
    try {
      result = playerQuestionResults(playerId, questionPosition);
    } catch (err: unknown) {
      const error = err as { error: string; message: string };
      if (error.error === 'INVALID_PLAYER_ID' ||
        error.error === 'INVALID_POSITION' ||
        error.error === 'INCOMPATIBLE_GAME_STATE') {
        res.status(400).json({
          error: error.error,
          message: error.message
        });
        return;
      }

      res.status(matchErrorStatus(error)).json({
        error: error.error,
        message: error.message
      });
      return;
    }
    res.status(200).json(result);
  });

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid as string);
  console.log(playerId);
  let result;
  try {
    result = playerResults(playerId);
  } catch (err: unknown) {
    const error = err as { error: string; message: string };
    if (error.error === 'INVALID_PLAYER_ID' || error.error === 'INCOMPATIBLE_GAME_STATE') {
      res.status(400).json({
        error: error.error,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.'
    });
    return;
  }

  res.status(200).json(result);
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const message = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using 'npm start' (instead of 'npm run dev') to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;

  res.status(404).json({ error: 'ROUTE_NOT_FOUND', message });
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
