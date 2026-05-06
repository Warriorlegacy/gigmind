'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatINR } from '@/lib/utils/formatting'
import { Send, Bot, User, MapPin, Briefcase, IndianRupee, Clock, X, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { ExtractedJob } from '@/lib/ai/agents'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Message {
  id: string
  role: 'user' | 'model'
  content: string
}

const CATEGORY_ICONS: Record<string, string> = {
  'real-estate': '🏠', 'medical': '🏥', 'home-repair': '🔧', 'office-assistance': '🏢',
  'interior-design': '🎨', 'security': '🔐', 'human-resources': '👥', 'cleaning': '🧹',
  'transport': '🚚', 'education': '📚', 'event-management': '🎉', 'it-services': '💻',
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedJob | null>(null)
  const [showJobCard, setShowJobCard] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [posting, setPosting] = useState(false)
  const [jobPosted, setJobPosted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    setSessionId(crypto.randomUUID())
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userMessage: text, sessionId }),
      })

      const data = await res.json()
      if (data.error) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: `Sorry, something went wrong: ${data.error}. Please try again.` }])
      } else {
        const aiMsg: Message = { id: crypto.randomUUID(), role: 'model', content: data.reply }
        setMessages(prev => [...prev, aiMsg])

        if (data.extracted) {
          setExtracted(data.extracted)
          setShowJobCard(true)
        }
      }
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: 'Network error. Please check your connection and try again.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handlePostJob = async () => {
    if (!user) {
      if (extracted) {
        localStorage.setItem('gigmind_pending_job', JSON.stringify(extracted))
      }
      router.push('/signup')
      return
    }

    if (!extracted || jobPosted) return

    setPosting(true)
    setJobPosted(true)
    try {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', extracted.category_slug)
        .maybeSingle()

      if (!category) {
        toast.error('Category not found')
        setJobPosted(false)
        return
      }

      const validBudgetTypes = ['hourly', 'daily', 'project', 'negotiable']
      const safeBudgetType = validBudgetTypes.includes(extracted.budget_type)
        ? extracted.budget_type
        : 'negotiable'

      const safeBudgetMin = extracted.budget_min && !isNaN(Number(extracted.budget_min))
        ? Number(extracted.budget_min)
        : null

      const safeBudgetMax = extracted.budget_max && !isNaN(Number(extracted.budget_max))
        ? Number(extracted.budget_max)
        : null

      let safeStartDate = null
      if (extracted.start_date) {
        const parsed = Date.parse(extracted.start_date)
        if (!isNaN(parsed)) {
          safeStartDate = new Date(parsed).toISOString().split('T')[0]
        }
      }

      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          hirer_id: user.id,
          category_id: category.id,
          title: extracted.title || 'Service Request',
          description: extracted.description || 'Details not provided.',
          location_text: extracted.location_text || '',
          city: extracted.city || '',
          budget_min: safeBudgetMin,
          budget_max: safeBudgetMax,
          budget_type: safeBudgetType,
          duration: extracted.duration || '',
          requirements: extracted.requirements || '',
          start_date: safeStartDate,
          ai_extracted_data: extracted,
          status: 'open',
        })
        .select('id')
        .single()

      if (error) {
        toast.error(`Failed to post job: ${error.message}`)
        setJobPosted(false)
        return
      }

      if (job) {
        toast.success('Job posted successfully!')
        router.push(`/jobs/${job.id}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post job'
      toast.error(message)
      setJobPosted(false)
    } finally {
      setPosting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-surface-border glass">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">G</span>
              </div>
              <span className="font-display font-bold text-lg text-white hidden sm:block">GigMind AI</span>
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium">
              <Sparkles className="w-3 h-3" /> AI Assistant
            </div>
          </div>
          {showJobCard && (
            <button
              onClick={() => setShowJobCard(!showJobCard)}
              className="md:hidden px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-xs font-medium"
            >
              Job Card
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-brand" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-white mb-2">What service do you need?</h2>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                    Tell me what you&apos;re looking for — in Hindi, English, or Hinglish. I&apos;ll help you create the perfect job posting.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['I need a plumber', 'Security guard for office', 'Home interior design', 'Property agent in Lucknow'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                        className="px-4 py-2 rounded-full bg-surface-card border border-surface-border text-sm text-muted-foreground hover:text-white hover:border-brand/30 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand text-white rounded-br-md'
                        : 'bg-surface-card border border-surface-border text-foreground rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-surface-card border border-surface-border rounded-bl-md">
                    <div className="flex gap-1.5">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-surface-border glass p-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what service you need..."
                className="flex-1 px-4 py-3 rounded-xl bg-surface-card border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-3 rounded-xl bg-brand-gradient text-white hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Job Card Preview — Desktop sidebar / Mobile modal */}
        {extracted && (
          <>
            {/* Desktop sidebar */}
            <div className={`${showJobCard ? 'block' : 'hidden'} md:block flex-shrink-0 w-80 border-l border-surface-border bg-surface-card overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-white">Job Preview</h3>
                  <button onClick={() => setShowJobCard(false)} className="md:hidden p-1 rounded-lg hover:bg-surface-hover">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[extracted.category_slug] || '🔧'}</span>
                    <div>
                      <div className="font-medium text-white text-sm">{extracted.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{extracted.category_slug.replace(/-/g, ' ')}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{extracted.location_text || extracted.city || 'Not specified'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <IndianRupee className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {extracted.budget_min && extracted.budget_max
                          ? `${formatINR(extracted.budget_min)} - ${formatINR(extracted.budget_max)}`
                          : extracted.budget_min
                          ? `From ${formatINR(extracted.budget_min)}`
                          : 'Negotiable'}
                        {extracted.budget_type !== 'negotiable' && <span className="text-xs ml-1">/ {extracted.budget_type}</span>}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{extracted.duration || 'Not specified'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{extracted.requirements || 'No special requirements'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-surface-border">
                    <div className="text-xs text-muted-foreground mb-1">Description</div>
                    <div className="text-sm text-foreground">{extracted.description}</div>
                  </div>

                  <button
                    onClick={handlePostJob}
                    disabled={posting || jobPosted}
                    className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {posting ? <>Posting... <Sparkles className="w-4 h-4 animate-spin" /></> : jobPosted ? 'Job Posted!' : <>Post This Job <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  {!user && (
                    <p className="text-xs text-muted-foreground text-center">You&apos;ll need to sign up to post this job</p>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile overlay */}
            {showJobCard && (
              <div className="md:hidden fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setShowJobCard(false)}>
                <div className="w-full bg-surface-card rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-white">Job Preview</h3>
                    <button onClick={() => setShowJobCard(false)} className="p-1 rounded-lg hover:bg-surface-hover">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CATEGORY_ICONS[extracted.category_slug] || '🔧'}</span>
                      <div>
                        <div className="font-medium text-white">{extracted.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{extracted.category_slug.replace(/-/g, ' ')}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-brand mt-0.5" />
                        <span className="text-sm text-muted-foreground">{extracted.location_text || extracted.city || 'Not specified'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <IndianRupee className="w-4 h-4 text-brand mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {extracted.budget_min && extracted.budget_max
                            ? `${formatINR(extracted.budget_min)} - ${formatINR(extracted.budget_max)}`
                            : 'Negotiable'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-brand mt-0.5" />
                        <span className="text-sm text-muted-foreground">{extracted.duration || 'Not specified'}</span>
                      </div>
                    </div>
                    <button
                      onClick={handlePostJob}
                      disabled={posting || jobPosted}
                      className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                    >
                      {posting ? <>Posting... <Sparkles className="w-4 h-4 animate-spin" /></> : jobPosted ? 'Job Posted!' : <>Post This Job <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
