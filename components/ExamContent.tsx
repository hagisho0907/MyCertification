'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import examData from '@/app/data/aws-devops-pro.json'
import QuestionCard from '@/components/QuestionCard'
import ProgressSummary from '@/components/ProgressSummary'
import {
  getExamProgress,
  createInitialProgress,
  startNewSession,
  completeCurrentSession,
  saveExamProgress,
  updateSessionPage,
  calculateSessionStats,
} from '@/lib/progress'
import { ExamProgress } from '@/lib/types'

const QUESTIONS_PER_PAGE = 20

export default function ExamContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  
  const [examProgress, setExamProgress] = useState<ExamProgress | null>(null)
  const [isPageSynced, setPageSynced] = useState(false)

  useEffect(() => {
    let progress = getExamProgress(examData.examId)
    if (!progress || progress.version !== examData.version) {
      progress = createInitialProgress(examData.examId, examData.version)
    }
    setExamProgress(progress)
  }, [])

  useEffect(() => {
    if (!examProgress || !examProgress.currentSession) return
    const lastPage = examProgress.currentSession.lastPage || 1
    if (!isPageSynced) {
      if (page !== lastPage) {
        setPageSynced(true)
        router.replace(`/exam?page=${lastPage}`)
      } else {
        setPageSynced(true)
      }
    }
  }, [examProgress, page, router, isPageSynced])

  const startIndex = (page - 1) * QUESTIONS_PER_PAGE
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, examData.questions.length)
  const questions = examData.questions.slice(startIndex, endIndex)
  const totalPages = Math.ceil(examData.questions.length / QUESTIONS_PER_PAGE)

  const handlePageChange = (newPage: number) => {
    if (!examProgress) return
    if (examProgress.currentSession) {
      const updated = updateSessionPage(examProgress, newPage)
      saveExamProgress(updated)
      setExamProgress(updated)
    }
    router.push(`/exam?page=${newPage}`)
  }

  const handleBeginSession = () => {
    if (!examProgress) return
    const updated = startNewSession(examProgress)
    saveExamProgress(updated)
    setExamProgress(updated)
    setPageSynced(false)
    router.replace('/exam?page=1')
  }

  const handleResumeSession = () => {
    if (!examProgress?.currentSession) return
    const targetPage = examProgress.currentSession.lastPage || 1
    const updated = updateSessionPage(examProgress, targetPage)
    saveExamProgress(updated)
    setExamProgress(updated)
    setPageSynced(false)
    router.push(`/exam?page=${targetPage}`)
  }

  const handleCompleteSession = () => {
    if (!examProgress) return
    const updated = completeCurrentSession(examProgress)
    saveExamProgress(updated)
    setExamProgress(updated)
    setPageSynced(false)
  }

  const handleFinishLearning = () => {
    handleCompleteSession()
    router.push('/')
  }

  if (!examProgress) return null

  const currentSessionNumber = examProgress.currentSession?.sessionNumber ?? examProgress.nextSessionNumber
  const currentSessionStats = calculateSessionStats(
    examProgress.currentSession,
    examData.meta.totalQuestions
  )
  const hasActiveSession = Boolean(examProgress.currentSession)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{examData.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {examProgress.currentSession
                  ? `第${examProgress.currentSession.sessionNumber}回目の学習中`
                  : `次は第${currentSessionNumber}回目の学習です`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ホームへ戻る
              </button>
              <ProgressSummary 
                examProgress={examProgress} 
                totalQuestions={examData.meta.totalQuestions}
                onStartNewSession={handleBeginSession}
                onResumeSession={handleResumeSession}
                onCompleteSession={handleCompleteSession}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">学習セッション</h2>
          {hasActiveSession && currentSessionStats ? (
            <>
              <p className="text-gray-600 mb-4">
                {`第${examProgress.currentSession!.sessionNumber}回目の学習を継続中です。途中のページから再開できます。`}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span>
                  正答率:{' '}
                  <span className="font-semibold text-blue-600">
                    {currentSessionStats.correctRate.toFixed(1)}%
                  </span>
                </span>
                <span>
                  回答数:{' '}
                  <span className="font-semibold">{currentSessionStats.answeredCount}</span>
                </span>
                <span>
                  不正解:{' '}
                  <span className="font-semibold text-red-600">
                    {currentSessionStats.incorrectCount}
                  </span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleResumeSession}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  続きから学習する
                </button>
                <button
                  onClick={handleCompleteSession}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  セッションを終了する
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                {`第${currentSessionNumber}回目の学習を開始すると、このセッションでの正答率や復習対象が記録されます。`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBeginSession}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {`第${currentSessionNumber}回目の学習を開始`}
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                セッションを開始すると問題一覧が表示されます。
              </p>
            </>
          )}
        </div>

        {examProgress.currentSession && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <span className="text-gray-600">
                ページ {page} / {totalPages} （{startIndex + 1}〜{endIndex} 問目）
              </span>
              <button
                onClick={handleCompleteSession}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                セッションを終了する
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionNumber={startIndex + index + 1}
                  examProgress={examProgress}
                  onProgressUpdate={setExamProgress}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                前の20問
              </button>
              
              <span className="text-gray-600">
                {page} / {totalPages}
              </span>
              
              {page < totalPages ? (
                <button
                  onClick={() => handlePageChange(page + 1)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  次の20問
                </button>
              ) : (
                <button
                  onClick={handleFinishLearning}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  学習を終了する
                </button>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  )
}
