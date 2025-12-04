import { Suspense } from 'react'
import ReviewContent from '@/components/ReviewContent'

function ReviewPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageSkeleton />}>
      <ReviewContent />
    </Suspense>
  )
}