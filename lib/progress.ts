'use client'

import { ExamProgress, QuestionProgress } from './types'

const STORAGE_KEY_PREFIX = 'mycert-progress-'

export function getExamProgress(examId: string): ExamProgress | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${examId}`)
  if (!stored) return null
  
  try {
    return JSON.parse(stored) as ExamProgress
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
  return {
    examId,
    version,
    updatedAt: new Date().toISOString(),
    questions: {}
  }
}

export function updateQuestionProgress(
  examProgress: ExamProgress,
  questionId: string,
  result: 'correct' | 'incorrect',
  isFlaggedForReview?: boolean
): ExamProgress {
  const existing = examProgress.questions[questionId] || {
    lastResult: 'unanswered',
    attempts: 0,
    correctAttempts: 0,
    isFlaggedForReview: false
  }
  
  const updated: QuestionProgress = {
    lastResult: result,
    answeredAt: new Date().toISOString(),
    attempts: existing.attempts + 1,
    correctAttempts: existing.correctAttempts + (result === 'correct' ? 1 : 0),
    isFlaggedForReview: isFlaggedForReview !== undefined ? isFlaggedForReview : existing.isFlaggedForReview
  }
  
  return {
    ...examProgress,
    updatedAt: new Date().toISOString(),
    questions: {
      ...examProgress.questions,
      [questionId]: updated
    }
  }
}

export function calculateStats(examProgress: ExamProgress, totalQuestions: number) {
  const questions = Object.values(examProgress.questions)
  const answered = questions.filter(q => q.lastResult !== 'unanswered')
  const correct = answered.filter(q => q.lastResult === 'correct')
  const flagged = questions.filter(q => q.isFlaggedForReview)
  const incorrect = answered.filter(q => q.lastResult === 'incorrect')
  
  return {
    totalQuestions,
    answeredCount: answered.length,
    correctCount: correct.length,
    incorrectCount: incorrect.length,
    unansweredCount: totalQuestions - answered.length,
    flaggedCount: flagged.length,
    correctRate: answered.length > 0 ? (correct.length / answered.length) * 100 : 0
  }
}

export function clearExamProgress(examId: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${examId}`)
}