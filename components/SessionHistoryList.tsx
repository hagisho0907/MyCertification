'use client'

import { useMemo, useState } from 'react'
import { Question, SessionProgress } from '@/lib/types'
import { calculateSessionStats } from '@/lib/progress'

type SessionHistoryListProps = {
  sessionHistory: SessionProgress[]
  totalQuestions: number
  questions: Question[]
  onDeleteSession: (sessionNumber: number) => void
}

type SessionDetailModalProps = {
  session: SessionProgress
  questions: Question[]
  onClose: () => void
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

const SessionDetailModal = ({ session, questions, onClose }: SessionDetailModalProps) => {
  const questionMap = useMemo(() => {
    const map = new Map<string, Question>()
    questions.forEach((q) => map.set(q.id, q))
    return map
  }, [questions])

  const sortedQuestionEntries = useMemo(() => {
    const entries = Object.entries(session.questions)
    entries.sort((a, b) => {
      const aIdx = questionMap.has(a[0])
        ? questions.findIndex((q) => q.id === a[0])
        : Number.MAX_SAFE_INTEGER
      const bIdx = questionMap.has(b[0])
        ? questions.findIndex((q) => q.id === b[0])
        : Number.MAX_SAFE_INTEGER
      return aIdx - bIdx
    })
    return entries
  }, [session.questions, questions, questionMap])

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              第{session.sessionNumber}回 セッション詳細
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              開始: {formatDateTime(session.startedAt)} / 終了:{' '}
              {formatDateTime(session.completedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="閉じる"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {sortedQuestionEntries.length === 0 ? (
            <p className="text-sm text-gray-500">
              このセッションでは回答記録がありません。
            </p>
          ) : (
            <div className="space-y-5">
              {sortedQuestionEntries.map(([questionId, progress]) => {
                const question = questionMap.get(questionId)
                if (!question) {
                  return (
                    <div
                      key={questionId}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500"
                    >
                      質問ID {questionId} は現在の問題データに存在しません。
                    </div>
                  )
                }

                const questionIndex = questions.findIndex((q) => q.id === questionId) + 1
                const selectedSet = new Set(progress.selectedChoiceIds ?? [])

                return (
                  <article
                    key={questionId}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Q{questionIndex}</p>
                        <p className="text-xs text-gray-500">
                          最終回答: {formatDateTime(progress.answeredAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          progress.lastResult === 'correct'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {progress.lastResult === 'correct' ? '正解' : '不正解'}
                      </span>
                    </header>

                    <p className="whitespace-pre-wrap text-sm text-gray-800">
                      {question.questionText}
                    </p>

                    <ul className="mt-4 space-y-2 text-sm">
                      {question.choices.map((choice) => {
                        const isCorrect = choice.isCorrect
                        const isSelected = selectedSet.has(choice.id)
                        return (
                          <li
                            key={choice.id}
                            className={`flex items-start rounded-lg border px-3 py-2 ${
                              isCorrect
                                ? 'border-green-500 bg-green-50'
                                : isSelected
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <span className="mr-2 font-semibold">{choice.id}.</span>
                            <span className="flex-1 text-gray-700">{choice.text}</span>
                            {isSelected && (
                              <span className="ml-3 text-xs font-semibold text-gray-600">
                                選択
                              </span>
                            )}
                            {isCorrect && (
                              <span className="ml-3 text-xs font-semibold text-green-600">
                                正解
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    {question.explanation && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                        <h4 className="mb-1 font-semibold text-gray-800">解説</h4>
                        <p className="whitespace-pre-wrap">{question.explanation}</p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SessionHistoryList({
  sessionHistory,
  totalQuestions,
  questions,
  onDeleteSession,
}: SessionHistoryListProps) {
  const [selectedSession, setSelectedSession] = useState<SessionProgress | null>(null)

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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    第{session.sessionNumber}回
                  </h3>
                  <p className="text-xs text-gray-500">
                    開始: {formatDateTime(session.startedAt)} / 終了:{' '}
                    {formatDateTime(session.completedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSession(session)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    詳細を見る
                  </button>
                  <button
                    onClick={() => onDeleteSession(session.sessionNumber)}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    削除
                  </button>
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

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          questions={questions}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </section>
  )
}
