export type Choice = {
  id: string
  text: string
  isCorrect: boolean
}

export type Question = {
  id: string
  questionText: string
  isMultiAnswer: boolean
  choices: Choice[]
  explanation: string
  referenceLinks: string[]
  tags: string[]
}

export type ExamData = {
  examId: string
  title: string
  version: string
  questions: Question[]
  meta: {
    totalQuestions: number
    lastUpdatedAt: string
  }
}

export type SessionQuestionProgress = {
  lastResult: 'correct' | 'incorrect'
  answeredAt: string
  attempts: number
  correctAttempts: number
}

export type SessionProgress = {
  sessionNumber: number
  startedAt: string
  updatedAt: string
  completedAt?: string
  questions: Record<string, SessionQuestionProgress>
}

export type CumulativeQuestionProgress = {
  lastResult: 'correct' | 'incorrect' | 'unanswered'
  lastAnsweredAt?: string
  totalAttempts: number
  totalCorrect: number
  isFlaggedForReview: boolean
}

export type ExamProgress = {
  examId: string
  version: string
  updatedAt: string
  nextSessionNumber: number
  currentSession?: SessionProgress
  sessionHistory: SessionProgress[]
  cumulative: Record<string, CumulativeQuestionProgress>
}
