'use client'

import { useState, useEffect } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon, FlagIcon } from '@heroicons/react/24/outline'

interface MultiLevelFlagProps {
  flagLevel: number // 0-5
  onFlagLevelChange: (newLevel: number) => void
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export default function MultiLevelFlag({
  flagLevel,
  onFlagLevelChange,
  size = 'md',
  showTooltip = true,
}: MultiLevelFlagProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [animatingLevel, setAnimatingLevel] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const maxLevel = 5
  
  // フラグレベルに応じた色とメッセージ
  const getFlagColor = (level: number) => {
    if (level === 0) return 'text-gray-300'
    if (level === 1) return 'text-yellow-400'
    if (level === 2) return 'text-yellow-500'
    if (level === 3) return 'text-orange-500'
    if (level === 4) return 'text-red-500'
    if (level === 5) return 'text-red-600'
    return 'text-gray-300'
  }

  const getFlagMessage = (level: number) => {
    if (level === 0) return 'フラグなし'
    if (level === 1) return '要確認'
    if (level === 2) return '復習推奨'
    if (level === 3) return '重要：要復習'
    if (level === 4) return '最重要：必ず復習'
    if (level === 5) return '超重要：完璧にする'
    return 'フラグなし'
  }

  const handleClick = () => {
    const nextLevel = flagLevel >= maxLevel ? 0 : flagLevel + 1
    setAnimatingLevel(nextLevel)
    onFlagLevelChange(nextLevel)
    
    // アニメーション効果をリセット
    setTimeout(() => setAnimatingLevel(null), 200)
  }

  const renderStarDisplay = () => {
    return (
      <div className="flex items-center">
        {Array.from({ length: maxLevel }, (_, i) => {
          const level = i + 1
          const isFilled = level <= flagLevel
          const isAnimating = animatingLevel === flagLevel && level === flagLevel
          
          return (
            <StarIcon
              key={i}
              className={`${sizeClasses[size]} transition-all duration-200 ${
                isFilled ? getFlagColor(flagLevel) : 'text-gray-200'
              } ${isAnimating ? 'scale-125' : ''}`}
            />
          )
        })}
        {flagLevel > 0 && (
          <span className={`ml-1 text-xs font-medium ${getFlagColor(flagLevel)}`}>
            {flagLevel}
          </span>
        )}
      </div>
    )
  }

  const renderFlagDisplay = () => {
    if (flagLevel === 0) {
      return (
        <FlagIcon 
          className={`${sizeClasses[size]} text-gray-300 transition-all duration-200`}
        />
      )
    }

    return (
      <div className="relative">
        <StarIcon
          className={`${sizeClasses[size]} ${getFlagColor(flagLevel)} transition-all duration-200 ${
            animatingLevel === flagLevel ? 'scale-125' : ''
          }`}
        />
        {flagLevel > 1 && (
          <span className={`absolute -top-1 -right-1 bg-white rounded-full text-xs font-bold min-w-[16px] h-4 flex items-center justify-center border ${getFlagColor(flagLevel)}`}>
            {flagLevel}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded"
        title={showTooltip ? `${getFlagMessage(flagLevel)} (クリックで変更)` : undefined}
      >
        {size === 'sm' ? renderFlagDisplay() : renderStarDisplay()}
      </button>

      {/* ツールチップ */}
      {showTooltip && isHovering && (
        <div className="absolute z-10 px-2 py-1 mt-2 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap -translate-x-1/2 left-1/2">
          {getFlagMessage(flagLevel)}
          <br />
          <span className="text-gray-300">クリックで {flagLevel >= maxLevel ? 'リセット' : 'レベルアップ'}</span>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      )}
    </div>
  )
}