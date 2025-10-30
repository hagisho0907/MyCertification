import Link from 'next/link'
import { calculateStats, getExamProgress } from '@/lib/progress'
import examData from './data/sample.json'
import StatsCards from '@/components/StatsCards'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">MyCertification</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">{examData.title}</h2>
          <p className="text-gray-600 mb-2">問題数: {examData.meta.totalQuestions}問</p>
          <p className="text-gray-600 mb-6">最終更新日: {examData.meta.lastUpdatedAt}</p>
          
          <div className="flex gap-4">
            <Link
              href="/exam"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              学習を始める
            </Link>
            <Link
              href="/review"
              className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              復習リストを見る
            </Link>
          </div>
        </div>

        <StatsCards examId={examData.examId} totalQuestions={examData.meta.totalQuestions} />
      </main>
    </div>
  )
}