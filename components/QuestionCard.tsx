'use client'

import { useState } from 'react'
import { Question, ExamProgress } from '@/lib/types'
import {
  updateQuestionProgress,
  saveExamProgress,
  setReviewFlag,
  setFlagLevel,
} from '@/lib/progress'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import MultiLevelFlag from '@/components/MultiLevelFlag'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  examProgress: ExamProgress
  onProgressUpdate: (progress: ExamProgress) => void
}

export default function QuestionCard({
  question,
  questionNumber,
  examProgress,
  onProgressUpdate,
}: QuestionCardProps) {
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(new Set())
  const [isAnswered, setIsAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  
  const sessionQuestion = examProgress.currentSession?.questions[question.id]
  const cumulativeQuestion = examProgress.cumulative[question.id]
  const isFlagged = cumulativeQuestion?.isFlaggedForReview || false
  const flagLevel = cumulativeQuestion?.flagLevel ?? 0
  const attempts = sessionQuestion?.attempts ?? 0
  const latestResult = sessionQuestion?.lastResult

  const handleSingleChoice = (choiceId: string) => {
    if (isAnswered) return
    
    setSelectedChoices(new Set([choiceId]))
    checkAnswer(new Set([choiceId]))
  }

  const handleMultipleChoice = (choiceId: string) => {
    if (isAnswered) return
    
    const newSelected = new Set(selectedChoices)
    if (newSelected.has(choiceId)) {
      newSelected.delete(choiceId)
    } else {
      newSelected.add(choiceId)
    }
    setSelectedChoices(newSelected)
  }

  const handleSubmitMultiple = () => {
    if (selectedChoices.size === 0) return
    checkAnswer(selectedChoices)
  }

  const checkAnswer = (selected: Set<string>) => {
    const correctChoiceIds = question.choices
      .filter(c => c.isCorrect)
      .map(c => c.id)
    
    const isCorrectAnswer = 
      correctChoiceIds.length === selected.size &&
      correctChoiceIds.every(id => selected.has(id))
    
    setIsCorrect(isCorrectAnswer)
    setIsAnswered(true)
    setShowExplanation(true)
    
    const updatedProgress = updateQuestionProgress(examProgress, question.id, isCorrectAnswer ? 'correct' : 'incorrect', {
      selectedChoiceIds: Array.from(selected),
      forceFlag: isCorrectAnswer ? false : true,
    })
    
    saveExamProgress(updatedProgress)
    onProgressUpdate(updatedProgress)
  }

  const handleFlagLevelChange = (newLevel: number) => {
    const updatedProgress = setFlagLevel(examProgress, question.id, newLevel)
    saveExamProgress(updatedProgress)
    onProgressUpdate(updatedProgress)
  }

  const handleResetAnswer = () => {
    setSelectedChoices(new Set())
    setIsAnswered(false)
    setShowExplanation(false)
    setIsCorrect(false)
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${
      isAnswered ? (isCorrect ? 'border-2 border-green-500' : 'border-2 border-red-500') : ''
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-base font-semibold">Q{questionNumber}</h3>
          {attempts > 0 && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              このセッションで {attempts} 回回答済み（直近: {latestResult === 'correct' ? '正解' : '不正解'})
            </p>
          )}
        </div>
        <MultiLevelFlag
          flagLevel={flagLevel}
          onFlagLevelChange={handleFlagLevelChange}
          size="lg"
          showTooltip={true}
        />
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{question.questionText}</p>
        {question.isMultiAnswer && (
          <p className="mt-2 text-xs text-blue-600 font-medium">
            （複数選択）該当するものをすべて選んでください
          </p>
        )}
      </div>

      <div className="space-y-2.5 mb-4">
        {question.choices.map((choice) => (
          <label
            key={choice.id}
            className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
              isAnswered
                ? choice.isCorrect
                  ? 'bg-green-50 border-green-500'
                  : selectedChoices.has(choice.id)
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50'
                : selectedChoices.has(choice.id)
                ? 'bg-blue-50 border-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <input
              type={question.isMultiAnswer ? 'checkbox' : 'radio'}
              name={`question-${question.id}`}
              value={choice.id}
              checked={selectedChoices.has(choice.id)}
              onChange={() => 
                question.isMultiAnswer 
                  ? handleMultipleChoice(choice.id)
                  : handleSingleChoice(choice.id)
              }
              disabled={isAnswered}
              className="mt-0.5 mr-3"
            />
            <div className="flex-1 leading-snug">
              <span className="font-medium mr-2">{choice.id}.</span>
              <span>{choice.text}</span>
            </div>
            {isAnswered && choice.isCorrect && (
              <CheckCircleIcon className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />
            )}
            {isAnswered && !choice.isCorrect && selectedChoices.has(choice.id) && (
              <XCircleIcon className="w-4 h-4 text-red-600 ml-2 flex-shrink-0" />
            )}
          </label>
        ))}
      </div>

      {question.isMultiAnswer && !isAnswered && (
        <button
          onClick={handleSubmitMultiple}
          disabled={selectedChoices.size === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          回答を確定
        </button>
      )}

      {isAnswered && (
        <div className="mt-5">
          <div className={`p-2.5 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={`text-sm font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '正解！' : '不正解'}
            </p>
          </div>
          
          {showExplanation && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-1.5">解説</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{question.explanation}</p>
              
              {question.referenceLinks && question.referenceLinks.trim() && (
                <div className="mt-3">
                  <h5 className="font-medium text-xs text-gray-600 mb-1">参考リンク:</h5>
                  <div className="text-sm">
                    <a
                      href={question.referenceLinks}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {question.referenceLinks}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isAnswered && (
        <div className="mt-3">
          <button
            onClick={handleResetAnswer}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            解答をリセットして再挑戦する
          </button>
        </div>
      )}
    </div>
  )
}
