'use client'

import { ExamProgress } from '@/lib/types'
import { calculateStats } from '@/lib/progress'
import { ArrowPathIcon, PlayIcon, Square2StackIcon } from '@heroicons/react/24/outline'

interface ProgressSummaryProps {
  examProgress: ExamProgress
  totalQuestions: number
  onStartNewSession?: () => void
  onResumeSession?: () => void
  onCompleteSession?: () => void
}

export default function ProgressSummary({
  examProgress,
  totalQuestions,
  onStartNewSession,
  onResumeSession,
  onCompleteSession,
}: ProgressSummaryProps) {
  const { session, cumulative } = calculateStats(examProgress, totalQuestions)
  const hasActiveSession = Boolean(examProgress.currentSession)
  
  const handleReset = () => {
    if (confirm('学習履歴をリセットしますか？この操作は取り消せません。')) {
      localStorage.removeItem(`mycert-progress-${examProgress.examId}`)
      window.location.reload()
    }
  }
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col text-xs text-gray-600">
        <span className="font-semibold text-gray-800 mb-1">今回のセッション</span>
        {session ? (
          <div className="flex gap-3">
            <span>
              正答率: <span className="font-semibold text-blue-600">{session.correctRate.toFixed(1)}%</span>
            </span>
            <span>
              回答数: <span className="font-semibold">{session.answeredCount}</span>
            </span>
            <span>
              不正解: <span className="font-semibold text-red-600">{session.incorrectCount}</span>
            </span>
          </div>
        ) : (
          <span>未開始</span>
        )}
      </div>
      <div className="flex flex-col text-xs text-gray-600">
        <span className="font-semibold text-gray-800 mb-1">累積</span>
        <div className="flex gap-3">
          <span>
            正答率: <span className="font-semibold text-blue-600">{cumulative.correctRate.toFixed(1)}%</span>
          </span>
          <span>
            未回答: <span className="font-semibold">{cumulative.unansweredCount}</span>
          </span>
          <span>
            復習: <span className="font-semibold text-orange-600">{cumulative.flaggedCount}</span>
          </span>
        </div>
      </div>
      
      {onStartNewSession && !hasActiveSession && (
        <button
          onClick={onStartNewSession}
          className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
          title="新しいセッションを開始"
        >
          <PlayIcon className="w-5 h-5" />
        </button>
      )}

      {onResumeSession && hasActiveSession && (
        <button
          onClick={onResumeSession}
          className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
          title="セッションを再開"
        >
          <PlayIcon className="w-5 h-5" />
        </button>
      )}

      {onCompleteSession && hasActiveSession && (
        <button
          onClick={onCompleteSession}
          className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          title="セッションを終了"
        >
          <Square2StackIcon className="w-5 h-5" />
        </button>
      )}
      
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
