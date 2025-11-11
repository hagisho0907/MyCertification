'use client'

import { useEffect, useState } from 'react'
import { ExamProgress } from '@/lib/types'
import { calculateStats } from '@/lib/progress'
import { ArrowPathIcon, ChevronDownIcon, PlayIcon, Square2StackIcon } from '@heroicons/react/24/outline'

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
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    setIsCollapsed(mediaQuery.matches)
  }, [])
  
  const handleReset = () => {
    if (confirm('学習履歴をリセットしますか？この操作は取り消せません。')) {
      localStorage.removeItem(`mycert-progress-${examProgress.examId}`)
      window.location.reload()
    }
  }

  const toggleCollapse = () => setIsCollapsed(prev => !prev)
  const statusLabel = hasActiveSession
    ? `第${examProgress.currentSession!.sessionNumber}回目を記録中`
    : '次のセッションを開始できます'
  
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white/90 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Progress</p>
          <p className="text-sm font-medium text-gray-800">{statusLabel}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {onStartNewSession && !hasActiveSession && (
            <button
              onClick={onStartNewSession}
              className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
              title="新しいセッションを開始"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
          )}

          {onResumeSession && hasActiveSession && (
            <button
              onClick={onResumeSession}
              className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
              title="セッションを再開"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
          )}

          {onCompleteSession && hasActiveSession && (
            <button
              onClick={onCompleteSession}
              className="p-1.5 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="セッションを終了"
            >
              <Square2StackIcon className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="履歴をリセット"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          <button
            onClick={toggleCollapse}
            className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-expanded={!isCollapsed}
            aria-controls="progress-summary-panel"
            title={isCollapsed ? '詳しく表示' : '閉じる'}
          >
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div
          id="progress-summary-panel"
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6"
        >
          <div className="flex-1 min-w-[200px] rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <span className="block font-semibold text-gray-900 text-xs">今回のセッション</span>
            {session ? (
              <div className="mt-2 space-y-1">
                <p>
                  正答率:{' '}
                  <span className="font-semibold text-blue-600">
                    {session.correctRate.toFixed(1)}%
                  </span>
                </p>
                <p>
                  回答数: <span className="font-semibold">{session.answeredCount}</span>
                </p>
                <p>
                  不正解:{' '}
                  <span className="font-semibold text-red-600">{session.incorrectCount}</span>
                </p>
              </div>
            ) : (
              <p className="mt-2 text-gray-500">未開始</p>
            )}
          </div>

          <div className="flex-1 min-w-[200px] rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <span className="block font-semibold text-gray-900 text-xs">累積</span>
            <div className="mt-2 space-y-1">
              <p>
                正答率:{' '}
                <span className="font-semibold text-blue-600">
                  {cumulative.correctRate.toFixed(1)}%
                </span>
              </p>
              <p>
                未回答: <span className="font-semibold">{cumulative.unansweredCount}</span>
              </p>
              <p>
                復習:{' '}
                <span className="font-semibold text-orange-600">{cumulative.flaggedCount}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
