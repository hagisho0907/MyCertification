'use client'

import { calculateSessionStats } from '@/lib/progress'
import { SessionProgress } from '@/lib/types'

type SessionHistoryListProps = {
  sessionHistory: SessionProgress[]
  totalQuestions: number
}

const formatDateTime = (value: string | undefined) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export default function SessionHistoryList({
  sessionHistory,
  totalQuestions,
}: SessionHistoryListProps) {
  if (!sessionHistory.length) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">セッション履歴</h2>
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-500 text-center">
          これまでのセッション履歴はまだありません。
        </div>
      </section>
    )
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">セッション履歴</h2>
      <div className="space-y-4">
        {sessionHistory.map((session) => {
          const stats = calculateSessionStats(session, totalQuestions)
          return (
            <div
              key={session.sessionNumber}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  第{session.sessionNumber}回
                </h3>
                <div className="text-sm text-gray-500">
                  <span className="mr-3">
                    開始: {formatDateTime(session.startedAt)}
                  </span>
                  <span>終了: {formatDateTime(session.completedAt)}</span>
                </div>
              </div>

              {stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-gray-700">
                  <div>
                    <span className="block text-gray-500">正答率</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {stats.correctRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500">回答数</span>
                    <span className="text-lg font-semibold">
                      {stats.answeredCount} 問
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500">不正解</span>
                    <span className="text-lg font-semibold text-red-600">
                      {stats.incorrectCount} 問
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500">未回答</span>
                    <span className="text-lg font-semibold">
                      {stats.unansweredCount} 問
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  このセッションでは回答が記録されていません。
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
