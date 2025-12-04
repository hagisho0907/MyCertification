'use client'

import { useMemo, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { ExamProgress } from '@/lib/types'

interface EnhancedPaginationProps {
  currentPage: number
  totalPages: number
  questionsPerPage: number
  onPageChange: (page: number) => void
  examProgress?: ExamProgress | null
  totalQuestions?: number
}

export default function EnhancedPagination({
  currentPage,
  totalPages,
  questionsPerPage,
  onPageChange,
  examProgress,
  totalQuestions = 0,
}: EnhancedPaginationProps) {
  
  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // 入力フィールドでは無効化
      }
      
      if (event.key === 'ArrowLeft' && currentPage > 1) {
        event.preventDefault()
        onPageChange(currentPage - 1)
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        event.preventDefault()
        onPageChange(currentPage + 1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, onPageChange])

  // 各ページの進捗状況を計算
  const pageStats = useMemo(() => {
    if (!examProgress || !examProgress.cumulative) return {}
    
    const stats: Record<number, {
      answered: number
      correct: number
      total: number
      hasIncorrect: boolean
    }> = {}

    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * questionsPerPage
      const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions)
      const pageQuestionCount = endIndex - startIndex

      let answered = 0
      let correct = 0
      let hasIncorrect = false
      let maxFlagLevel = 0

      for (let i = startIndex; i < endIndex; i++) {
        const questionId = `DOP-C02-Q${String(i + 1).padStart(3, '0')}`
        const progress = examProgress.cumulative[questionId]
        
        if (progress && progress.totalAttempts > 0) {
          answered++
          if (progress.lastResult === 'correct') {
            correct++
          } else if (progress.lastResult === 'incorrect') {
            hasIncorrect = true
          }
          
          // フラグレベルも考慮
          if (progress.flagLevel && progress.flagLevel > maxFlagLevel) {
            maxFlagLevel = progress.flagLevel
          }
        }
      }

      stats[page] = {
        answered,
        correct,
        total: pageQuestionCount,
        hasIncorrect,
        maxFlagLevel,
      }
    }

    return stats
  }, [examProgress, totalPages, questionsPerPage, totalQuestions])

  // 表示するページ番号の計算
  const visiblePages = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    // 常に最初のページを表示
    pages.push(1)

    if (currentPage <= 3) {
      // 現在のページが最初の方
      for (let i = 2; i <= Math.min(4, totalPages); i++) {
        pages.push(i)
      }
      if (totalPages > 4) {
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    } else if (currentPage >= totalPages - 2) {
      // 現在のページが最後の方
      if (totalPages > 4) {
        pages.push('ellipsis')
      }
      for (let i = Math.max(totalPages - 3, 2); i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 現在のページが中間
      pages.push('ellipsis')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  const getPageButtonStyle = (page: number) => {
    const stats = pageStats[page] as any
    const isCurrent = page === currentPage
    
    let baseClasses = 'relative inline-flex items-center justify-center w-10 h-10 text-sm font-medium border transition-colors'
    
    if (isCurrent) {
      baseClasses += ' z-10 bg-blue-600 border-blue-600 text-white'
    } else if (stats?.hasIncorrect) {
      baseClasses += ' bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
    } else if (stats?.maxFlagLevel >= 4) {
      // 高フラグレベル（4-5）は紫色で表示
      baseClasses += ' bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
    } else if (stats?.maxFlagLevel >= 2) {
      // 中フラグレベル（2-3）はオレンジ色で表示
      baseClasses += ' bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
    } else if (stats?.answered === stats?.total && stats?.total > 0) {
      baseClasses += ' bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
    } else if (stats && stats.answered > 0) {
      baseClasses += ' bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
    } else {
      baseClasses += ' bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
    }
    
    return baseClasses
  }

  const getPageTooltip = (page: number) => {
    const stats = pageStats[page] as any
    if (!stats) return `ページ ${page}`
    
    const { answered, correct, total, hasIncorrect, maxFlagLevel } = stats
    const startQ = ((page - 1) * questionsPerPage) + 1
    const endQ = Math.min(page * questionsPerPage, totalQuestions)
    
    if (answered === 0) {
      return `ページ ${page} (${startQ}-${endQ}問) - 未回答`
    }
    
    const percentage = total > 0 ? Math.round((correct / answered) * 100) : 0
    let status = ''
    
    if (hasIncorrect) {
      status = '要復習'
    } else if (maxFlagLevel >= 4) {
      status = '超重要フラグ'
    } else if (maxFlagLevel >= 2) {
      status = '重要フラグ'
    } else if (answered === total) {
      status = '完了'
    } else {
      status = '一部回答済み'
    }
    
    let tooltip = `ページ ${page} (${startQ}-${endQ}問) - ${status} ${answered}/${total}回答 正答率${percentage}%`
    if (maxFlagLevel > 0) {
      tooltip += ` 最高フラグLv.${maxFlagLevel}`
    }
    
    return tooltip
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* 進捗サマリー */}
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            ページ {currentPage} / {totalPages} （問題 {((currentPage - 1) * questionsPerPage) + 1}〜{Math.min(currentPage * questionsPerPage, totalQuestions)}）
          </div>
          <div className="text-xs text-gray-500">
            ← → キーでページ移動 | 
            <span className="inline-block w-3 h-3 bg-green-100 border border-green-200 rounded mx-1"></span>完了 
            <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mx-1"></span>一部回答 
            <span className="inline-block w-3 h-3 bg-orange-100 border border-orange-200 rounded mx-1"></span>重要フラグ 
            <span className="inline-block w-3 h-3 bg-purple-100 border border-purple-200 rounded mx-1"></span>超重要フラグ 
            <span className="inline-block w-3 h-3 bg-red-100 border border-red-200 rounded mx-1"></span>要復習
          </div>
        </div>

        {/* ページネーション */}
        <nav className="flex items-center justify-center" aria-label="Pagination">
          <div className="flex items-center gap-1">
            {/* 前へボタン */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="前のページ (←)"
            >
              <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* ページ番号 */}
            {visiblePages.map((page, index) => (
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5" aria-hidden="true" />
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={getPageButtonStyle(page)}
                  title={getPageTooltip(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            ))}

            {/* 次へボタン */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="次のページ (→)"
            >
              <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </nav>

        {/* クイックナビゲーション */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            最初
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 5))}
            disabled={currentPage <= 5}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            -5ページ
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 5))}
            disabled={currentPage >= totalPages - 4}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            +5ページ
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            最後
          </button>
        </div>
      </div>
    </div>
  )
}