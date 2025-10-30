'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import examData from '@/app/data/sample.json'
import SessionHistoryList from '@/components/SessionHistoryList'
import { getExamProgress, removeSessionFromHistory, saveExamProgress } from '@/lib/progress'
import { ExamProgress } from '@/lib/types'

export default function HistoryPage() {
  const router = useRouter()
  const [examProgress, setExamProgress] = useState<ExamProgress | null>(null)
  const [draftHistory, setDraftHistory] = useState<ExamProgress | null>(null)

  useEffect(() => {
    const progress = getExamProgress(examData.examId)
    if (!progress) {
      router.push('/')
      return
    }
    setExamProgress(progress)
    setDraftHistory(progress)
  }, [router])

  if (!examProgress || !draftHistory) {
    return null
  }

  const handleDeleteSession = (sessionNumber: number) => {
    if (!draftHistory) return
    if (!confirm(`第${sessionNumber}回のセッション履歴を削除しますか？`)) return

    const updated = removeSessionFromHistory(draftHistory, sessionNumber)
    saveExamProgress(updated)
    setDraftHistory(updated)
    setExamProgress(updated)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">セッション履歴</h1>
              <p className="mt-2 text-sm text-gray-600">
                過去の学習セッションの正答率や解答内容を確認できます。
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SessionHistoryList
          sessionHistory={draftHistory.sessionHistory}
          totalQuestions={examData.meta.totalQuestions}
          questions={examData.questions}
          onDeleteSession={handleDeleteSession}
        />
      </main>
    </div>
  )
}
