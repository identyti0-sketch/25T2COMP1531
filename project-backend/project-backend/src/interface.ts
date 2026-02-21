export interface User {
  userId: number,
  email: string,
  password?: string,
  nameFirst?: string,
  nameLast?: string,
  numFailedPasswordsSinceLastLogin: number,
  numSuccessfulLogins: number,
  usedPassword?: (string)[],
  name?: string
}

export interface Quiz {
  quizId: number,
  creatorId?: number,
  name: string,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  numQuestions?: number, // length of quiz body array
  questions?: Question[], // array of questions
  timeLimit?: number, // sum of time limit of questions
  thumbnailUrl?: string
}

export interface Question {
  questionId?: number,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: Answer[],
  thumbnailUrl?: string
}

export interface Answer {
  answerId?: number,
  answer: string,
  correct: boolean
}

export interface Data {
  userData: (User)[],
  quizData: (Quiz)[],
  games: { [quizId: number]: Game[] },
  sessions: Sessions,
  nextUserId: number
}

export interface Error {
  error: string,
  message: string
}

export interface UserId {
  userId: number
}

export interface QuizId {
  quizId: number
}

export interface Check {
  check: boolean,
  returnObj: Error
}

export interface QuizNoUser {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited:number,
  description: string
}

export interface QuizNameId {

  quizId: number,
  name: string

}

export interface Sessions {
  [key: string]: number
}

export interface SessionId {
  session: string
}

export interface QuestionId {
  questionId: number
}

export interface Header {
  [key: string]: string;
}

export interface Game {
  gameId?: number,
  autoStartNum: number,
  state: string,
  atQuestion: number,
  players: Player[],
  metadata: Quiz,
  questionResults?: QuestionResult[],
  timeSinceStateUpdate?: number; // seconds since unix epoch, use Date.now()/1000
}

export interface QuestionResult {
  questionId?: number,
  playersCorrect: string[],
  playerAnswers?: { [playerId: number]: PlayerAnswer },
  averageAnswerTime: number,
  percentCorrect: number
}

export interface PlayerAnswer {
  answerIds: number[],
  timeToAnswer: number,
  isCorrect: boolean,
  pointsEarned: number
}

export interface Player {
  playerId: number,
  playerName: string
}

export interface GamePlayer {
  player: Player,
  game: Game
}

export interface UserRankedByScore {
  playerName: string;
  score: number;
}

export interface PlayerResults {
  usersRankedByScore: UserRankedByScore[];
  questionResults: QuestionResult[];
}

export interface IdTimeout {
  [key : number] : ReturnType<typeof setTimeout>
}

export interface Rank {
  playerName: string,
  score: number
}
