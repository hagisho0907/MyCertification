'use client'

import { useEffect, useState } from 'react'
import { calculateStats, getExamProgress } from '@/lib/progress'

interface StatsCardsProps {
  examId: string
  totalQuestions: number
}

export default function StatsCards({ examId, totalQuestions }: StatsCardsProps) {
  const [stats, setStats] = useState({
    correctRate: 0,
    answeredCount: 0,
    flaggedCount: 0,
  })

  useEffect(() => {
    const progress = getExamProgress(examId)
    if (progress) {
      const calculated = calculateStats(progress, totalQuestions)
      setStats({
        correctRate: calculated.correctRate,
        answeredCount: calculated.answeredCount,
        flaggedCount: calculated.flaggedCount,
      })
    }
  }, [examId, totalQuestions])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">正答率</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.correctRate.toFixed(1)}%</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">学習済み</h3>
        <p className="text-3xl font-bold text-green-600">
          {stats.answeredCount} / {totalQuestions}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">復習対象</h3>
        <p className="text-3xl font-bold text-orange-600">{stats.flaggedCount}</p>
      </div>
    </div>
  )
}