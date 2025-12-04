'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import examData from '@/app/data/aws-devops-pro.json'
import QuestionCard from '@/components/QuestionCard'
import EnhancedPagination from '@/components/EnhancedPagination'
import {
  getExamProgress,
  getReviewQuestionIds,
  ensureActiveSession,
  saveExamProgress,
  getProgressWithRemote,
} from '@/lib/progress'
import { ExamProgress, Question } from '@/lib/types'

const QUESTIONS_PER_PAGE = 10

export default function ReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  
  const [examProgress, setExamProgress] = useState<ExamProgress | null>(null)
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([])
  const [isHydrating, setHydrating] = useState(true)
  
  useEffect(() => {
    let cancelled = false
    const hydrate = async () => {
      let progress = getExamProgress(examData.examId)
      if (!progress) {
        router.push('/')
        return
      }
      if (!progress.currentSession) {
        progress = ensureActiveSession(progress)
        saveExamProgress(progress)
      }
      if (!cancelled) setExamProgress(progress)

      const synced = await getProgressWithRemote(examData.examId, examData.version)
      let nextProgress = synced
      if (!nextProgress.currentSession) {
        nextProgress = ensureActiveSession(nextProgress)
        saveExamProgress(nextProgress)
      }
      if (!cancelled) {
        setExamProgress(nextProgress)
        setHydrating(false)
      }
    }
    hydrate()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!examProgress) return
    const reviewTargetIds = new Set(getReviewQuestionIds(examProgress))
    const questionsToReview = examData.questions.filter((question) =>
      reviewTargetIds.has(question.id)
    )
    setReviewQuestions(questionsToReview)
  }, [examProgress])

  // ページネーション用の計算
  const paginatedQuestions = useMemo(() => {
    const startIndex = (page - 1) * QUESTIONS_PER_PAGE
    const endIndex = startIndex + QUESTIONS_PER_PAGE
    return reviewQuestions.slice(startIndex, endIndex)
  }, [reviewQuestions, page])

  const totalPages = Math.ceil(reviewQuestions.length / QUESTIONS_PER_PAGE)

  const handlePageChange = (newPage: number) => {
    router.push(`/review?page=${newPage}`)
  }

  if (!examProgress || isHydrating) return null

  if (reviewQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">復習リスト</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">復習対象の問題がありません。</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">復習リスト</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                復習対象: <span className="font-semibold text-orange-600">{reviewQuestions.length}問</span>
              </span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mb-6">
            <EnhancedPagination
              currentPage={page}
              totalPages={totalPages}
              questionsPerPage={QUESTIONS_PER_PAGE}
              onPageChange={handlePageChange}
              examProgress={examProgress}
              totalQuestions={reviewQuestions.length}
            />
          </div>
        )}

        <div className="space-y-6">
          {paginatedQuestions.map((question, index) => {
            const questionNumber = examData.questions.findIndex(q => q.id === question.id) + 1
            return (
              <QuestionCard
                key={question.id}
                question={question}
                questionNumber={questionNumber}
                examProgress={examProgress}
                onProgressUpdate={setExamProgress}
              />
            )
          })}
        </div>

        {/* Bottom pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <EnhancedPagination
              currentPage={page}
              totalPages={totalPages}
              questionsPerPage={QUESTIONS_PER_PAGE}
              onPageChange={handlePageChange}
              examProgress={examProgress}
              totalQuestions={reviewQuestions.length}
            />
          </div>
        )}
      </main>
    </div>
  )
}