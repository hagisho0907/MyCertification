'use client'

import {
  ExamProgress,
  SessionProgress,
  SessionQuestionProgress,
  CumulativeQuestionProgress,
} from './types'

const STORAGE_KEY_PREFIX = 'mycert-progress-'

const isoNow = () => new Date().toISOString()

const createEmptyCumulative = (): CumulativeQuestionProgress => ({
  lastResult: 'unanswered',
  totalAttempts: 0,
  totalCorrect: 0,
  isFlaggedForReview: false,
})

const cloneSessionWithQuestion = (
  session: SessionProgress,
  questionId: string,
  questionProgress: SessionQuestionProgress
): SessionProgress => ({
  ...session,
  updatedAt: isoNow(),
  questions: {
    ...session.questions,
    [questionId]: questionProgress,
  },
})

const finalizeSession = (session: SessionProgress): SessionProgress => {
  const now = isoNow()
  return {
    ...session,
    updatedAt: now,
    completedAt: session.completedAt ?? now,
  }
}

const isProgressV2 = (data: unknown): data is ExamProgress => {
  if (!data || typeof data !== 'object') return false
  const progress = data as Partial<ExamProgress>
  return (
    typeof progress.examId === 'string' &&
    typeof progress.version === 'string' &&
    typeof progress.nextSessionNumber === 'number' &&
    Array.isArray(progress.sessionHistory) &&
    progress.cumulative !== undefined
  )
}

export function getExamProgress(examId: string): ExamProgress | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${examId}`)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    if (!isProgressV2(parsed)) {
      return null
    }
    return parsed as ExamProgress
  } catch {
    return null
  }
}

export function saveExamProgress(progress: ExamProgress): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${progress.examId}`,
    JSON.stringify(progress)
  )
}

export function createInitialProgress(examId: string, version: string): ExamProgress {
  const now = isoNow()
  return {
    examId,
    version,
    updatedAt: now,
    nextSessionNumber: 1,
    currentSession: undefined,
    sessionHistory: [],
    cumulative: {},
  }
}

export function startNewSession(progress: ExamProgress): ExamProgress {
  const now = isoNow()
  const sessionNumber = progress.nextSessionNumber
  const newSession: SessionProgress = {
    sessionNumber,
    startedAt: now,
    updatedAt: now,
    lastPage: 1,
    questions: {},
  }

  const history = progress.currentSession
    ? [finalizeSession(progress.currentSession), ...progress.sessionHistory]
    : progress.sessionHistory

  return {
    ...progress,
    updatedAt: now,
    currentSession: newSession,
    sessionHistory: history,
    nextSessionNumber: sessionNumber + 1,
  }
}

export function ensureActiveSession(progress: ExamProgress): ExamProgress {
  if (progress.currentSession) return progress
  return startNewSession(progress)
}

export function completeCurrentSession(progress: ExamProgress): ExamProgress {
  if (!progress.currentSession) return progress
  const completed = finalizeSession(progress.currentSession)
  return {
    ...progress,
    updatedAt: isoNow(),
    currentSession: undefined,
    sessionHistory: [completed, ...progress.sessionHistory],
  }
}

type UpdateQuestionOptions = {
  selectedChoiceIds?: string[]
  forceFlag?: boolean
}

export function updateQuestionProgress(
  examProgress: ExamProgress,
  questionId: string,
  result: 'correct' | 'incorrect',
  options: UpdateQuestionOptions = {}
): ExamProgress {
  const now = isoNow()
  const progressWithSession = ensureActiveSession(examProgress)
  const currentSession = progressWithSession.currentSession!
  const existingSessionQuestion = currentSession.questions[questionId]
  const selectedChoiceIds =
    options.selectedChoiceIds ?? existingSessionQuestion?.selectedChoiceIds ?? []

  const updatedSessionQuestion: SessionQuestionProgress = {
    lastResult: result,
    answeredAt: now,
    attempts: (existingSessionQuestion?.attempts ?? 0) + 1,
    correctAttempts:
      (existingSessionQuestion?.correctAttempts ?? 0) + (result === 'correct' ? 1 : 0),
    selectedChoiceIds,
  }

  const existingCumulative =
    progressWithSession.cumulative[questionId] ?? createEmptyCumulative()

  const updatedCumulative: CumulativeQuestionProgress = {
    lastResult: result,
    lastAnsweredAt: now,
    totalAttempts: existingCumulative.totalAttempts + 1,
    totalCorrect: existingCumulative.totalCorrect + (result === 'correct' ? 1 : 0),
    isFlaggedForReview:
      options.forceFlag !== undefined
        ? options.forceFlag
        : result === 'incorrect'
        ? true
        : existingCumulative.isFlaggedForReview,
  }

  return {
    ...progressWithSession,
    updatedAt: now,
    currentSession: cloneSessionWithQuestion(
      currentSession,
      questionId,
      updatedSessionQuestion
    ),
    cumulative: {
      ...progressWithSession.cumulative,
      [questionId]: updatedCumulative,
    },
  }
}

export function updateSessionPage(
  examProgress: ExamProgress,
  page: number
): ExamProgress {
  if (!examProgress.currentSession) return examProgress
  const now = isoNow()
  const updatedSession: SessionProgress = {
    ...examProgress.currentSession,
    updatedAt: now,
    lastPage: page,
  }

  return {
    ...examProgress,
    updatedAt: now,
    currentSession: updatedSession,
  }
}

export function setReviewFlag(
  examProgress: ExamProgress,
  questionId: string,
  isFlagged: boolean
): ExamProgress {
  const now = isoNow()
  const existing = examProgress.cumulative[questionId] ?? createEmptyCumulative()
  return {
    ...examProgress,
    updatedAt: now,
    cumulative: {
      ...examProgress.cumulative,
      [questionId]: {
        ...existing,
        lastResult: existing.lastResult,
        lastAnsweredAt: existing.lastAnsweredAt,
        totalAttempts: existing.totalAttempts,
        totalCorrect: existing.totalCorrect,
        isFlaggedForReview: isFlagged,
      },
    },
  }
}

export type ProgressStats = {
  answeredCount: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  flaggedCount: number
  correctRate: number
}

export type CombinedStats = {
  session: ProgressStats | null
  cumulative: ProgressStats
}

export function calculateSessionStats(
  session: SessionProgress | undefined,
  totalQuestions: number
): ProgressStats | null {
  if (!session) return null
  const values = Object.values(session.questions)
  const answeredCount = values.length
  const correctCount = values.filter((q) => q.lastResult === 'correct').length
  const incorrectCount = values.filter((q) => q.lastResult === 'incorrect').length
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0)
  const flaggedCount = incorrectCount
  const correctRate = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0

  return {
    answeredCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    flaggedCount,
    correctRate,
  }
}

const calculateCumulativeStats = (
  cumulative: Record<string, CumulativeQuestionProgress>,
  totalQuestions: number
): ProgressStats => {
  const values = Object.values(cumulative)
  const answeredValues = values.filter((q) => q.totalAttempts > 0)
  const answeredCount = answeredValues.length
  const correctCount = answeredValues.filter((q) => q.lastResult === 'correct').length
  const incorrectCount = answeredValues.filter((q) => q.lastResult === 'incorrect').length
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0)
  const flaggedCount = values.filter((q) => q.isFlaggedForReview).length
  const totalAttempts = values.reduce((sum, q) => sum + q.totalAttempts, 0)
  const totalCorrect = values.reduce((sum, q) => sum + q.totalCorrect, 0)
  const correctRate = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0

  return {
    answeredCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    flaggedCount,
    correctRate,
  }
}

export function calculateStats(
  examProgress: ExamProgress,
  totalQuestions: number
): CombinedStats {
  return {
    session: calculateSessionStats(examProgress.currentSession, totalQuestions),
    cumulative: calculateCumulativeStats(examProgress.cumulative, totalQuestions),
  }
}

export function clearExamProgress(examId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${examId}`)
}

export function getReviewQuestionIds(progress: ExamProgress): string[] {
  return Object.entries(progress.cumulative)
    .filter(([_, value]) => value.isFlaggedForReview || value.lastResult === 'incorrect')
    .map(([questionId]) => questionId)
}
