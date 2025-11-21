import { NextResponse } from 'next/server'
import { ExamProgress } from '@/lib/types'

const GIST_FILENAME = 'progress.json'

type StoredPayload = {
  exams: Record<string, ExamProgress>
}

const getEnv = () => {
  const token = process.env.GITHUB_TOKEN
  const gistId = process.env.GITHUB_GIST_ID
  return { token, gistId }
}

const githubHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
})

async function fetchGistContent(token: string, gistId: string): Promise<StoredPayload | null> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: githubHeaders(token),
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error('[progress] Failed to fetch gist', res.status, await res.text())
    return null
  }

  const data = await res.json()
  const file = data?.files?.[GIST_FILENAME]
  if (!file?.content) return { exams: {} }

  try {
    const parsed = JSON.parse(file.content as string)
    if (parsed && typeof parsed === 'object' && parsed.exams) {
      return parsed as StoredPayload
    }
  } catch (err) {
    console.error('[progress] Failed to parse gist JSON', err)
  }
  return { exams: {} }
}

async function updateGistContent(
  token: string,
  gistId: string,
  payload: StoredPayload
): Promise<boolean> {
  const body = {
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  }

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[progress] Failed to update gist', res.status, await res.text())
    return false
  }
  return true
}

export async function GET() {
  const { token, gistId } = getEnv()
  if (!token || !gistId) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN and GITHUB_GIST_ID are required' },
      { status: 500 }
    )
  }

  const payload = await fetchGistContent(token, gistId)
  if (!payload) {
    return NextResponse.json({ exams: {} }, { status: 200 })
  }
  return NextResponse.json(payload, { status: 200 })
}

export async function PUT(req: Request) {
  const { token, gistId } = getEnv()
  if (!token || !gistId) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN and GITHUB_GIST_ID are required' },
      { status: 500 }
    )
  }

  let incoming: ExamProgress | null = null
  try {
    const body = await req.json()
    incoming = body?.examProgress ?? null
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!incoming?.examId) {
    return NextResponse.json({ error: 'examProgress is required' }, { status: 400 })
  }

  const current = (await fetchGistContent(token, gistId)) ?? { exams: {} }
  current.exams[incoming.examId] = incoming

  const ok = await updateGistContent(token, gistId, current)
  if (!ok) {
    return NextResponse.json({ error: 'Failed to update gist' }, { status: 502 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
