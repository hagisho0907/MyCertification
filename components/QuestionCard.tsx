'use client'

import { useState, useEffect } from 'react'
import { Question, ExamProgress } from '@/lib/types'
import { updateQuestionProgress, saveExamProgress } from '@/lib/progress'
import { CheckCircleIcon, XCircleIcon, FlagIcon } from '@heroicons/react/24/solid'
import { FlagIcon as FlagOutlineIcon } from '@heroicons/react/24/outline'

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
  
  const progressData = examProgress.questions[question.id]
  const isFlagged = progressData?.isFlaggedForReview || false

  useEffect(() => {
    if (progressData && progressData.lastResult !== 'unanswered') {
      setIsAnswered(true)
      setShowExplanation(true)
      setIsCorrect(progressData.lastResult === 'correct')
    }
  }, [progressData])

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
    
    const updatedProgress = updateQuestionProgress(
      examProgress,
      question.id,
      isCorrectAnswer ? 'correct' : 'incorrect',
      isCorrectAnswer ? false : true
    )
    
    saveExamProgress(updatedProgress)
    onProgressUpdate(updatedProgress)
  }

  const toggleFlag = () => {
    if (!progressData || progressData.lastResult === 'unanswered') {
      // If not answered yet, just update the flag
      const updatedProgress = {
        ...examProgress,
        updatedAt: new Date().toISOString(),
        questions: {
          ...examProgress.questions,
          [question.id]: {
            lastResult: 'unanswered' as const,
            attempts: 0,
            correctAttempts: 0,
            isFlaggedForReview: !isFlagged
          }
        }
      }
      saveExamProgress(updatedProgress)
      onProgressUpdate(updatedProgress)
    } else {
      // If already answered, update normally
      const updatedProgress = updateQuestionProgress(
        examProgress,
        question.id,
        progressData.lastResult,
        !isFlagged
      )
      saveExamProgress(updatedProgress)
      onProgressUpdate(updatedProgress)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${
      isAnswered ? (isCorrect ? 'border-2 border-green-500' : 'border-2 border-red-500') : ''
    }`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Q{questionNumber}</h3>
        <button
          onClick={toggleFlag}
          className="text-orange-500 hover:text-orange-600"
          title={isFlagged ? '復習フラグを外す' : '復習フラグを付ける'}
        >
          {isFlagged ? (
            <FlagIcon className="w-6 h-6" />
          ) : (
            <FlagOutlineIcon className="w-6 h-6" />
          )}
        </button>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-800 whitespace-pre-wrap">{question.questionText}</p>
        {question.isMultiAnswer && (
          <p className="mt-2 text-sm text-blue-600 font-medium">
            （複数選択）該当するものをすべて選んでください
          </p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {question.choices.map((choice) => (
          <label
            key={choice.id}
            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
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
            <div className="flex-1">
              <span className="font-medium mr-2">{choice.id}.</span>
              <span>{choice.text}</span>
            </div>
            {isAnswered && choice.isCorrect && (
              <CheckCircleIcon className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />
            )}
            {isAnswered && !choice.isCorrect && selectedChoices.has(choice.id) && (
              <XCircleIcon className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
            )}
          </label>
        ))}
      </div>

      {question.isMultiAnswer && !isAnswered && (
        <button
          onClick={handleSubmitMultiple}
          disabled={selectedChoices.size === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          回答を確定
        </button>
      )}

      {isAnswered && (
        <div className="mt-6">
          <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '正解！' : '不正解'}
            </p>
          </div>
          
          {showExplanation && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">解説</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{question.explanation}</p>
              
              {question.referenceLinks.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-sm text-gray-600 mb-1">参考リンク:</h5>
                  <ul className="space-y-1">
                    {question.referenceLinks.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}