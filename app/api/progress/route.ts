import { NextResponse } from 'next/server'
import { ExamProgress } from '@/lib/types'
import { getSupabaseServiceClient } from '@/lib/supabase'

const TABLE = 'exam_progress'

type StoredPayload = {
  exams: Record<string, ExamProgress>
}

type ExamProgressRow = {
  exam_id: string
  payload: ExamProgress
  updated_at: string | null
}

const buildMissingConfigResponse = () =>
  NextResponse.json(
    { error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' },
    { status: 500 }
  )

export async function GET() {
  let supabase
  try {
    supabase = getSupabaseServiceClient()
  } catch (err) {
    console.error('[progress] Supabase client init failed', err)
    return buildMissingConfigResponse()
  }

  const { data, error } = await supabase.from(TABLE).select('exam_id,payload,updated_at')

  if (error) {
    console.error('[progress] Supabase fetch failed', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 502 })
  }

  const rows = (data ?? []) as ExamProgressRow[]
  const exams = rows.reduce<StoredPayload['exams']>((acc, row) => {
    if (row.exam_id && row.payload) {
      acc[row.exam_id] = row.payload
    }
    return acc
  }, {})

  return NextResponse.json({ exams }, { status: 200 })
}

export async function PUT(req: Request) {
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

  let supabase
  try {
    supabase = getSupabaseServiceClient()
  } catch (err) {
    console.error('[progress] Supabase client init failed', err)
    return buildMissingConfigResponse()
  }

  const row: ExamProgressRow = {
    exam_id: incoming.examId,
    payload: incoming,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'exam_id' })

  if (error) {
    console.error('[progress] Supabase upsert failed', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 502 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
