```javascript
let data = {
  userData: [
    {
      userId: 0,
      email: 'ranivorous@gmail.com',
      password: "12345678",
      nameFirst: 'Rani',
      nameLast: 'Jiang',
      numFailedPasswordsSinceLastLogin: 0,
      numSuccessfulLogins: 0
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
    }
  ],
  nextUserId: 1,
  nextQuizId: 1
}

```


Data (All data is contained in the data object):
  - userData (Array contains all user objects):
    - user (object):
      - userId: number
      - email: string
      - password: string
      - nameFirst: string
      - nameLast: string
      - numFailedPasswordsSinceLastLogin: number
      - numSuccessfulLogins: number
  - quizData (Array contains all quiz objects):
    - quiz (object):
      - quizId: number
      - creatorId: number
      - description: string
      - name: string
      - timeCreated: number,
      - timeLastEdited: number,
  - nextUserId: number
  - nextQuizId: number
