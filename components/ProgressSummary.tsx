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
  compact?: boolean
  defaultCollapsed?: boolean
}

export default function ProgressSummary({
  examProgress,
  totalQuestions,
  onStartNewSession,
  onResumeSession,
  onCompleteSession,
  compact = false,
  defaultCollapsed = false,
}: ProgressSummaryProps) {
  const { session, cumulative } = calculateStats(examProgress, totalQuestions)
  const hasActiveSession = Boolean(examProgress.currentSession)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  useEffect(() => {
    if (defaultCollapsed) return
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const handleChange = (event: MediaQueryListEvent) => setIsCollapsed(event.matches)
    setIsCollapsed(mediaQuery.matches)
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Fallback for Safari < 14
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [defaultCollapsed])
  
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
  const containerClasses = compact
    ? 'w-full rounded-lg border border-gray-200 bg-white p-1.5 sm:p-2.5 shadow-sm'
    : 'w-full rounded-xl border border-gray-200 bg-white/90 p-3 sm:p-4 shadow-sm'
  const labelClasses = compact
    ? 'text-[9px] font-semibold uppercase tracking-wide text-gray-500'
    : 'text-[11px] font-semibold uppercase tracking-wide text-gray-500'
  const statusClasses = compact
    ? 'text-[11px] font-medium text-gray-800'
    : 'text-sm font-medium text-gray-800'
  const iconButtonPadding = compact ? 'p-0.5' : 'p-1.5'
  const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4'
  const detailText = compact ? 'text-xs' : 'text-sm'
  const detailLabel = compact ? 'text-[11px]' : 'text-xs'
  const detailSpacing = compact ? 'mt-2 space-y-0.5' : 'mt-2 space-y-1'

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-2">
        <div>
          <p className={labelClasses}>Progress</p>
          <p className={statusClasses}>{statusLabel}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {onStartNewSession && !hasActiveSession && (
            <button
              onClick={onStartNewSession}
              className={`${iconButtonPadding} text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50`}
              title="新しいセッションを開始"
            >
              <PlayIcon className={iconSize} />
            </button>
          )}

          {onResumeSession && hasActiveSession && (
            <button
              onClick={onResumeSession}
              className={`${iconButtonPadding} text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50`}
              title="セッションを再開"
            >
              <PlayIcon className={iconSize} />
            </button>
          )}

          {onCompleteSession && hasActiveSession && (
            <button
              onClick={onCompleteSession}
              className={`${iconButtonPadding} text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100`}
              title="セッションを終了"
            >
              <Square2StackIcon className={iconSize} />
            </button>
          )}
          
          <button
            onClick={handleReset}
            className={`${iconButtonPadding} text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100`}
            title="履歴をリセット"
          >
            <ArrowPathIcon className={iconSize} />
          </button>

          <button
            onClick={toggleCollapse}
            className={`${iconButtonPadding} text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100`}
            aria-expanded={!isCollapsed}
            aria-controls="progress-summary-panel"
            title={isCollapsed ? '詳しく表示' : '閉じる'}
          >
            <ChevronDownIcon
              className={`${iconSize} transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div
          id="progress-summary-panel"
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
        >
          <div className={`flex-1 min-w-[180px] rounded-lg bg-gray-50 p-2.5 ${detailText} text-gray-600`}>
            <span className={`block font-semibold text-gray-900 ${detailLabel}`}>今回のセッション</span>
            {session ? (
              <div className={detailSpacing}>
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

          <div className={`flex-1 min-w-[180px] rounded-lg bg-gray-50 p-2.5 ${detailText} text-gray-600`}>
            <span className={`block font-semibold text-gray-900 ${detailLabel}`}>累積</span>
            <div className={detailSpacing}>
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
