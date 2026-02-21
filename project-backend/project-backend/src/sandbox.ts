import request from 'sync-request-curl';
import config from './config.json';
import { rqstBody, rqstBodyHead } from './tests/testHelper';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

const res = rqstBody('POST', '/v1/admin/auth/register',
  {
    email: 'samuel.mu753@gmail.com',
    password: 'abcd1234',
    nameFirst: 'Samuel',
    nameLast: 'Mu'
  }
);
const res3 = rqstBodyHead('POST', '/v1/admin/quiz',
  { session: res.body.session },
  {
    name: 'My Quiz Name',
    description: 'lorem ipsum'
  }
);
const id = res3.body.quizId;

const res4 = rqstBodyHead('POST', '/v1/admin/quiz/' + id + '/question',
  { session: res.body.session },
  {
    questionBody: {
      question: 'Who is the Monarch of England?',
      timeLimit: 18,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Donald Duck',
          correct: false
        }
      ],
      thumbnailUrl: 'https://google.com/some/image/path.JPg'
    }
  }
);
const res2 = rqstBodyHead('GET', '/v1/admin/quiz/' + res3.body.quizId,
  { session: res.body.session },
  {}
);

console.log(res4);
console.log(res2.body);
request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
