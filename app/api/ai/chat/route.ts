import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobIntakeChat, type ChatMessage } from '@/lib/ai/agents'
import { rateLimit } from '@/lib/rateLimit'
import { sanitizeInput } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const clientKey = user?.id || request.headers.get('x-forwarded-for') || 'anonymous'

    if (!rateLimit(`ai-chat:${clientKey}`, 20, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Wait 1 minute.' }, { status: 429 })
    }

    const body = await request.json()
    const { messages, userMessage, sessionId } = body as {
      messages: ChatMessage[]
      userMessage: string
      sessionId?: string
    }

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
    }

    const sanitizedMessage = sanitizeInput(userMessage)
    const sanitizedHistory = (messages || []).map((message) => ({
      role: message.role,
      content: sanitizeInput(message.content),
    }))

    const { reply, extracted, searchParams, isComplete } = await jobIntakeChat(sanitizedHistory, sanitizedMessage)

    if (sessionId && user) {
      const updatedMessages = [
        ...(messages || []),
        { role: 'user' as const, content: sanitizedMessage },
        { role: 'model' as const, content: reply },
      ]

      await supabase.from('ai_sessions').upsert({
        id: sessionId,
        user_id: user.id,
        session_type: 'job_intake',
        messages: updatedMessages,
        extracted_data: extracted || searchParams,
        status: isComplete ? 'completed' : 'active',
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ reply, extracted, searchParams, isComplete })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI service unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
