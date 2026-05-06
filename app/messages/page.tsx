'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils/formatting'
import { Send, ArrowLeft, Sparkles, Bot, User, CircleCheck as CheckCircle, MessageSquare, Trash2 } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface Conversation {
  id: string
  job_id: string
  hirer_id: string
  provider_id: string
  last_message: string | null
  last_message_at: string
  hirer_unread: number
  provider_unread: number
  jobs: { title: string; status: string } | null
  hirer_profile: { full_name: string; avatar_url: string | null } | null
  provider_profile: { full_name: string; avatar_url: string | null } | null
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_ai_message: boolean
  created_at: string
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id)
      subscribeToMessages(activeConv.id)
      markAsRead(activeConv.id)
    }
  }, [activeConv?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('conversations')
      .select('*, jobs(title, status), profiles!conversations_hirer_id_fkey(id, full_name, avatar_url), provider_profile:provider_profiles(user_id, profiles(full_name, avatar_url))')
      .or(`hirer_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    const convData = (data || []).map((c: any) => ({
      ...c,
      hirer_profile: c.hirer_id === user.id ? null : c.profiles,
      provider_profile: c.provider_id === user.id ? null : c.provider_profile?.profiles,
    })) as Conversation[]

    setConversations(convData)

    const convId = searchParams.get('id')
    const providerIdParam = searchParams.get('provider')
    const jobIdParam = searchParams.get('job')

    if (convId) {
      const found = convData.find(c => c.id === convId)
      if (found) setActiveConv(found)
    } else if (providerIdParam) {
      // Look for existing conversation with this provider (and optionally job)
      let found = convData.find(c => 
        (c.provider_id === providerIdParam || c.provider_profile?.user_id === providerIdParam) && 
        (!jobIdParam || c.job_id === jobIdParam)
      )
      
      if (found) {
        setActiveConv(found)
      } else {
        // Create a temporary conversation object for the UI
        // We'll actually save it when the first message is sent
        const { data: provProfile } = await supabase
          .from('provider_profiles')
          .select('*, profiles(full_name, avatar_url)')
          .eq('id', providerIdParam)
          .maybeSingle()
        
        if (provProfile) {
          const tempConv: any = {
            id: 'temp',
            hirer_id: user.id,
            provider_id: provProfile.user_id,
            job_id: jobIdParam,
            provider_profile: provProfile.profiles,
            hirer_profile: null,
            last_message: null,
            last_message_at: new Date().toISOString(),
            hirer_unread: 0,
            provider_unread: 0
          }
          setActiveConv(tempConv)
        }
      }
    } else if (convData.length > 0) {
      setActiveConv(convData[0])
    }

    setLoading(false)
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    setMessages(data || [])
  }

  const subscribeToMessages = (convId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    channelRef.current = supabase
      .channel(`messages:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
  }

  const markAsRead = async (convId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const conv = conversations.find(c => c.id === convId)
    if (!conv) return

    const isHirer = conv.hirer_id === user.id
    const update = isHirer ? { hirer_unread: 0 } : { provider_unread: 0 }

    await supabase.from('conversations').update(update).eq('id', convId)
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, ...update } : c))
  }

  const handleHire = async () => {
    if (!activeConv || !activeConv.job_id || sending) return

    const confirmed = confirm(`Are you sure you want to hire ${getOtherName(activeConv)} for this job?`)
    if (!confirmed) return

    setSending(true)
    try {
      // 1. Update job
      const { error: jobErr } = await supabase
        .from('jobs')
        .update({ 
          status: 'in_progress',
          hired_provider_id: activeConv.provider_id 
        })
        .eq('id', activeConv.job_id)

      if (jobErr) throw jobErr

      // 2. Update application status
      await supabase
        .from('applications')
        .update({ status: 'hired' })
        .eq('job_id', activeConv.job_id)
        .eq('provider_id', activeConv.provider_id)

      // 3. Send system message
      const systemMsg = `System: ${getOtherName(activeConv)} has been hired for this job!`
      await supabase.from('messages').insert({
        conversation_id: activeConv.id,
        sender_id: userId,
        content: systemMsg,
      })

      // 4. Update local state
      setActiveConv(prev => prev ? { ...prev, jobs: prev.jobs ? { ...prev.jobs, status: 'in_progress' } : null } : null)
      toast.success('Provider hired successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to hire provider')
    }
    setSending(false)
  }

  const sendMessage = async () => {
    const text = newMessage.trim()
    if (!text || !activeConv || sending) return

    setSending(true)
    try {
      let currentConvId = activeConv.id

      if (currentConvId === 'temp') {
        // 1. Create real conversation
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            hirer_id: activeConv.hirer_id,
            provider_id: activeConv.provider_id,
            job_id: activeConv.job_id,
            last_message: text,
            last_message_at: new Date().toISOString(),
            provider_unread: 1
          })
          .select()
          .single()
        
        if (convErr) throw convErr
        currentConvId = newConv.id
        setActiveConv({ ...activeConv, id: currentConvId })
        // Reload list to show new conv
        loadData()
      }

      const { data: msg, error } = await supabase.from('messages').insert({
        conversation_id: currentConvId,
        sender_id: userId,
        content: text,
      }).select().single()

      if (error) throw error

      if (activeConv.id !== 'temp') {
        // Update other person's unread count
        const isHirer = activeConv.hirer_id === userId
        const update = isHirer 
          ? { last_message: text, last_message_at: new Date().toISOString(), provider_unread: (activeConv.provider_unread || 0) + 1 }
          : { last_message: text, last_message_at: new Date().toISOString(), hirer_unread: (activeConv.hirer_unread || 0) + 1 }

        await supabase.from('conversations')
          .update(update)
          .eq('id', currentConvId)
      }

      setNewMessage('')
    } catch (err) {
      toast.error('Failed to send message')
    }
    setSending(false)
  }

  const getOtherName = (conv: Conversation) => {
    if (conv.hirer_id === userId) {
      return conv.provider_profile?.full_name || 'Provider'
    }
    return conv.hirer_profile?.full_name || 'Hirer'
  }

  const getUnread = (conv: Conversation) => {
    return conv.hirer_id === userId ? conv.hirer_unread : conv.provider_unread
  }

  return (
    <div className="h-screen bg-surface flex flex-col">
      <Navigation />

      <div className="flex-1 flex overflow-hidden pt-16">
        {/* Conversation List */}
        <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-surface-border bg-surface-card`}>
          <div className="p-4 border-b border-surface-border">
            <h2 className="font-display font-bold text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full p-4 text-left hover:bg-surface-hover transition-colors border-b border-surface-border ${
                    activeConv?.id === conv.id ? 'bg-surface-hover' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white text-sm truncate">{getOtherName(conv)}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatRelativeTime(conv.last_message_at)}</span>
                  </div>
                  {conv.jobs && (
                    <div className="text-xs text-brand mb-1">{conv.jobs.title}</div>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message || 'No messages yet'}</p>
                  {getUnread(conv) > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-xs mt-1">{getUnread(conv)}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Thread */}
        <div className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="flex-shrink-0 p-4 border-b border-surface-border glass">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveConv(null)} className="md:hidden p-1 rounded-lg hover:bg-surface-hover">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">{getOtherName(activeConv)}</div>
                      {activeConv.jobs && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{activeConv.jobs.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            activeConv.jobs.status === 'in_progress' ? 'bg-info-bg text-info' :
                            activeConv.jobs.status === 'completed' ? 'bg-success-bg text-success' :
                            'bg-surface-hover text-muted-foreground'
                          }`}>{activeConv.jobs.status.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Hire Action (only for hirer) */}
                    {activeConv.hirer_id === userId && activeConv.jobs?.status === 'open' && (
                      <button
                        onClick={handleHire}
                        disabled={sending}
                        className="px-4 py-1.5 rounded-lg bg-success text-white text-xs font-bold hover:bg-success/90 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Hire
                      </button>
                    )}
                  </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender_id !== userId && !msg.is_ai_message && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      {msg.is_ai_message && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.sender_id === userId
                            ? 'bg-brand text-white rounded-br-md'
                            : msg.is_ai_message
                            ? 'bg-brand/10 border border-brand/20 text-foreground rounded-bl-md'
                            : 'bg-surface-card border border-surface-border text-foreground rounded-bl-md'
                        }`}
                      >
                        {msg.is_ai_message && <span className="text-xs text-brand font-medium block mb-1">AI Assistant</span>}
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-surface-border glass p-4">
                <div className="max-w-2xl mx-auto flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl bg-surface-card border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-3 rounded-xl bg-brand-gradient text-white hover:opacity-90 transition-opacity disabled:opacity-30"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-white mb-1">Select a conversation</h3>
                <p className="text-muted-foreground text-sm">Choose a conversation from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
