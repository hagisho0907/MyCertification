'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import examData from '@/app/data/sample.json'
import QuestionCard from '@/components/QuestionCard'
import { getExamProgress } from '@/lib/progress'
import { ExamProgress, Question } from '@/lib/types'

export default function ReviewPage() {
  const router = useRouter()
  const [examProgress, setExamProgress] = useState<ExamProgress | null>(null)
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([])
  
  useEffect(() => {
    const progress = getExamProgress(examData.examId)
    if (!progress) {
      router.push('/')
      return
    }
    
    setExamProgress(progress)
    
    // Filter questions that are flagged for review or incorrect
    const questionsToReview = examData.questions.filter(question => {
      const progressData = progress.questions[question.id]
      return progressData && (
        progressData.isFlaggedForReview || 
        progressData.lastResult === 'incorrect'
      )
    })
    
    setReviewQuestions(questionsToReview)
  }, [router])

  if (!examProgress) return null

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
        <div className="space-y-6">
          {reviewQuestions.map((question, index) => {
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
      </main>
    </div>
  )
}