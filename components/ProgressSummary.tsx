'use client'

import { ExamProgress } from '@/lib/types'
import { calculateStats } from '@/lib/progress'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface ProgressSummaryProps {
  examProgress: ExamProgress
  totalQuestions: number
}

export default function ProgressSummary({ examProgress, totalQuestions }: ProgressSummaryProps) {
  const stats = calculateStats(examProgress, totalQuestions)
  
  const handleReset = () => {
    if (confirm('学習履歴をリセットしますか？この操作は取り消せません。')) {
      localStorage.removeItem(`mycert-progress-${examProgress.examId}`)
      window.location.reload()
    }
  }
  
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">
          正答率: <span className="font-semibold text-blue-600">{stats.correctRate.toFixed(1)}%</span>
        </span>
        <span className="text-gray-600">
          未回答: <span className="font-semibold">{stats.unansweredCount}</span>
        </span>
        <span className="text-gray-600">
          復習: <span className="font-semibold text-orange-600">{stats.flaggedCount}</span>
        </span>
      </div>
      
      <button
        onClick={handleReset}
        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        title="履歴をリセット"
      >
        <ArrowPathIcon className="w-5 h-5" />
      </button>
    </div>
  )
}