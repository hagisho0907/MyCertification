'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import examData from '@/app/data/sample.json'
import QuestionCard from '@/components/QuestionCard'
import ProgressSummary from '@/components/ProgressSummary'
import { getExamProgress, createInitialProgress } from '@/lib/progress'
import { ExamProgress } from '@/lib/types'

const QUESTIONS_PER_PAGE = 20

export default function ExamContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  
  const [examProgress, setExamProgress] = useState<ExamProgress | null>(null)
  
  useEffect(() => {
    let progress = getExamProgress(examData.examId)
    if (!progress || progress.version !== examData.version) {
      progress = createInitialProgress(examData.examId, examData.version)
    }
    setExamProgress(progress)
  }, [])

  const startIndex = (page - 1) * QUESTIONS_PER_PAGE
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, examData.questions.length)
  const questions = examData.questions.slice(startIndex, endIndex)
  const totalPages = Math.ceil(examData.questions.length / QUESTIONS_PER_PAGE)

  const handlePageChange = (newPage: number) => {
    router.push(`/exam?page=${newPage}`)
  }

  if (!examProgress) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{examData.title}</h1>
            <ProgressSummary 
              examProgress={examProgress} 
              totalQuestions={examData.meta.totalQuestions}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-gray-600">
            ページ {page} / {totalPages} （{startIndex + 1}〜{endIndex} 問目）
          </span>
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
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              学習を終了する
            </button>
          )}
        </div>
      </main>
    </div>
  )
}