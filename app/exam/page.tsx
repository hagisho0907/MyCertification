import { Suspense } from 'react'
import ExamContent from '@/components/ExamContent'

function ExamPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 rounded w-64"></div>
              <div className="h-4 bg-gray-300 rounded w-48"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 bg-gray-300 rounded w-24"></div>
              <div className="h-8 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm mb-6">
          <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded w-40"></div>
        </div>
      </main>
    </div>
  )
}

export default function ExamPage() {
  return (
    <Suspense fallback={<ExamPageSkeleton />}>
      <ExamContent />
    </Suspense>
  )
}