// import { sessionToUserId } from '../helper';
import request, { HttpVerb } from 'sync-request-curl';
import { port, url } from '../config.json';
import { Error, SessionId, Question, QuestionId, Header } from '../interface';
import { matchErrorStatus } from '../helper';
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;
export const ERROR = (type: string) => (
  {
    error: type,
    message: expect.any(String),
  }
);

export function clearHelper (): object {
  const re = request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  return JSON.parse(re.body as string);
}

export function userDetailsHelper (session: string): Error|object {
  const re = request('GET', SERVER_URL + '/v1/admin/user/details/', {
    headers: {
      session: session//,
      //      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function userDetailsUpdateHelper (session: string,
  email: string,
  nameFirst: string,
  nameLast: string): Error|object {
  const re = request('PUT', SERVER_URL + '/v1/admin/user/details/', {
    headers: {
      session: session//,
      //      'Content-Type': 'application/json'
    },
    json: { email, nameFirst, nameLast },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function quizRemoveHelper (sessionid: string, quizid: number): Error|object {
  const re = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizid}`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function quizRemoveHelperV2 (sessionid: string, quizid: number): Error|object {
  const re = request('DELETE', SERVER_URL + `/v2/admin/quiz/${quizid}`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}
export function quizCreateHelper (sessionid: string,
  name: string,
  description: string): Error|object {
  const re = request('POST', SERVER_URL + '/v1/admin/quiz', {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    json: { name, description },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function questionCreateHelper (quizid: number, sessionid: string,
  questionBody: object): Error|QuestionId {
  const re = request('POST', SERVER_URL + `/v1/admin/quiz/${quizid}/question`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    json: { questionBody },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function questionRemoveHelper (quizid: number,
  questionid: number,
  sessionid: string): Error|object {
  const re = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizid}/question/${questionid}`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function questionRemoveHelperV2 (quizid: number,
  questionid: number,
  sessionid: string): Error|object {
  const re = request('DELETE', SERVER_URL + `/v2/admin/quiz/${quizid}/question/${questionid}`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}
export function quizInfoHelper (sessionid: string,
  quizId: number): Error|object|Question {
  const re = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function gameInfoHelper (sessionid: string,
  quizid: number, gameid: number): Error|object|Question {
  const re = request('GET', SERVER_URL + `/v1/admin/quiz/${quizid}/game/${gameid}`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}
export function gameStartHelper (quizid: number,
  sessionid: string,
  autoStartNum: number
): Error|object|Question | { gameId: number } {
  const re = request('POST', SERVER_URL + `/v1/admin/quiz/${quizid}/game/start`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    json: {
      autoStartNum: autoStartNum
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}
export function playerJoinHelper (gameId: number, playerName: string) {
  const re = request('POST', SERVER_URL + '/v1/player/join', {

    json: {
      gameId: gameId,
      playerName: playerName
    },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function playerQuestionHelper (playerid: number, questionposition: number) {
  const re = request('GET', SERVER_URL + `/v1/player/${playerid}/question/${questionposition}`, {
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function playerSubmissionHelper (playerid: number,
  questionposition: number,
  answerId: number) {
  const re = request('GET', SERVER_URL + `/v1/player/${playerid}/question/${questionposition}`, {
    timeout: TIMEOUT_MS,
    json: { answerId: answerId }
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}
export function authRegisterHelper (
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string): Error|SessionId {
  const re = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: { email, password, nameFirst, nameLast },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return { session: body.session };
  }
}

export function statusUpdateHelper (
  action: string,
  gameid: number,
  quizid: number,
  sessionid: string): Error|SessionId {
  const re = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/game/${gameid}`, {
    headers: {
      session: sessionid,
      'Content-Type': 'application/json'
    },
    json: { action },
    timeout: TIMEOUT_MS
  });
  const body = JSON.parse(re.body as string);
  if ('error' in body) {
    if (matchStatus(re.statusCode, body) === true) {
      return body;
    } else {
      return { error: 'MISMATCH_ERROR', message: 'Mismatch of status code and error message' };
    }
  } else {
    return body;
  }
}

export function matchStatus (status: number, error: Error): boolean {
  switch (status) {
    case 200:
    case 304:
      return true;
    case 400:
      if (matchErrorStatus(error) === 400) {
        return true;
      }
      break;
    case 401:
      if (matchErrorStatus(error) === 401) {
        return true;
      }
      break;
    case 403:
      if (matchErrorStatus(error) === 403) {
        return true;
      }
      break;
  }

  return false;
}
export function rqst(meth: HttpVerb, path: string) {
  const res = request(meth, SERVER_URL + path, { timeout: TIMEOUT_MS });
  return { body: JSON.parse(res.body.toString()), statusCode: res.statusCode };
}

export function rqstBody(meth: HttpVerb, path: string, input: unknown) {
  const res = request(meth, SERVER_URL + path, { json: input, timeout: TIMEOUT_MS });
  return { body: JSON.parse(res.body.toString()), statusCode: res.statusCode };
}

export function rqstQuery(meth: HttpVerb, path: string, input: unknown) {
  const res = request(meth, SERVER_URL + path, { qs: input, timeout: TIMEOUT_MS });
  return { body: JSON.parse(res.body.toString()), statusCode: res.statusCode };
}

export function rqstHead(meth: HttpVerb, path: string, input: Header) {
  const res = request(meth, SERVER_URL + path,
    { headers: input, timeout: TIMEOUT_MS });
  return { body: JSON.parse(res.body.toString()), statusCode: res.statusCode };
}

export function rqstBodyHead(meth: HttpVerb, path: string, inputHead: Header, inputBody: unknown) {
  const res = request(meth, SERVER_URL + path,
    { headers: inputHead, json: inputBody, timeout: TIMEOUT_MS });
  return { body: JSON.parse(res.body.toString()), statusCode: res.statusCode };
}

export function expectToBe(
  fn: (...args: unknown[]) => unknown,
  args: unknown[],
  expectedOutput: unknown
): void {
  try {
    const output = fn(...args);
    expect(output).toStrictEqual(expectedOutput);
  } catch (err) {
    expect(err).toStrictEqual(expectedOutput);
  }
}
