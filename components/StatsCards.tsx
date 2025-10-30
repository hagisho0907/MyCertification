'use client'

import { useEffect, useState } from 'react'
import { calculateStats, getExamProgress } from '@/lib/progress'

interface StatsCardsProps {
  examId: string
  totalQuestions: number
}

type StatsSnapshot = {
  sessionCorrectRate: number | null
  sessionAnsweredCount: number | null
  sessionIncorrectCount: number | null
  cumulativeCorrectRate: number
  cumulativeAnsweredCount: number
  cumulativeFlaggedCount: number
}

export default function StatsCards({ examId, totalQuestions }: StatsCardsProps) {
  const [stats, setStats] = useState<StatsSnapshot>({
    sessionCorrectRate: null,
    sessionAnsweredCount: null,
    sessionIncorrectCount: null,
    cumulativeCorrectRate: 0,
    cumulativeAnsweredCount: 0,
    cumulativeFlaggedCount: 0,
  })

  useEffect(() => {
    const progress = getExamProgress(examId)
    if (progress) {
      const calculated = calculateStats(progress, totalQuestions)
      setStats({
        sessionCorrectRate: calculated.session ? calculated.session.correctRate : null,
        sessionAnsweredCount: calculated.session ? calculated.session.answeredCount : null,
        sessionIncorrectCount: calculated.session ? calculated.session.incorrectCount : null,
        cumulativeCorrectRate: calculated.cumulative.correctRate,
        cumulativeAnsweredCount: calculated.cumulative.answeredCount,
        cumulativeFlaggedCount: calculated.cumulative.flaggedCount,
      })
    }
  }, [examId, totalQuestions])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">今回のセッション</h3>
        {stats.sessionCorrectRate !== null ? (
          <div className="space-y-1">
            <p className="text-3xl font-bold text-blue-600">
              {stats.sessionCorrectRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              回答数: {stats.sessionAnsweredCount} | 不正解: {stats.sessionIncorrectCount}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">まだ開始されていません。</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">累積 正答率</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.cumulativeCorrectRate.toFixed(1)}%</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">累積 学習済み</h3>
        <p className="text-3xl font-bold text-green-600">
          {stats.cumulativeAnsweredCount} / {totalQuestions}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">復習対象</h3>
        <p className="text-3xl font-bold text-orange-600">{stats.cumulativeFlaggedCount}</p>
      </div>
    </div>
  )
}
