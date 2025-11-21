'use client'

import { ExamProgress } from './types'

type StoredPayload = {
  exams: Record<string, ExamProgress>
}

const pickLatest = (a: ExamProgress | null, b: ExamProgress | null): ExamProgress | null => {
  if (a && !b) return a
  if (!a && b) return b
  if (!a && !b) return null
  // a と b の両方が存在するケース
  return new Date(a!.updatedAt) >= new Date(b!.updatedAt) ? a! : b!
}

export async function fetchRemoteExamProgress(examId: string): Promise<ExamProgress | null> {
  try {
    const res = await fetch('/api/progress', { cache: 'no-store' })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = (await res.json()) as StoredPayload
    return data?.exams?.[examId] ?? null
  } catch (err) {
    console.error('[progress] fetchRemoteExamProgress failed', err)
    return null
  }
}

export async function pushRemoteExamProgress(progress: ExamProgress): Promise<void> {
  try {
    const res = await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examProgress: progress }),
    })
    if (!res.ok) {
      throw new Error(`status ${res.status}`)
    }
  } catch (err) {
    console.error('[progress] pushRemoteExamProgress failed', err)
  }
}

export function pickLatestProgress(
  local: ExamProgress | null,
  remote: ExamProgress | null
): ExamProgress | null {
  return pickLatest(local, remote)
}
