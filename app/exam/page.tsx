import { Suspense } from 'react'
import ExamContent from '@/components/ExamContent'

export default function ExamPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExamContent />
    </Suspense>
  )
}