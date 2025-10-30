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

export type QuestionProgress = {
  lastResult: 'correct' | 'incorrect' | 'unanswered'
  answeredAt?: string
  attempts: number
  correctAttempts: number
  isFlaggedForReview: boolean
}

export type ExamProgress = {
  examId: string
  version: string
  updatedAt: string
  questions: Record<string, QuestionProgress>
}