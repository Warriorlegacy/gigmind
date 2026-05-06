import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface ExtractedJob {
  title: string
  category_slug: string
  description: string
  location_text: string
  city: string
  budget_min: number | null
  budget_max: number | null
  budget_type: 'hourly' | 'daily' | 'project' | 'negotiable'
  duration: string
  requirements: string
  start_date: string | null
}

const JOB_INTAKE_SYSTEM = `You are GigMind's AI assistant for India's service marketplace.
Help users describe their service requirement clearly.

Available categories: real-estate, medical, home-repair, office-assistance,
interior-design, security, human-resources, cleaning, transport, education,
event-management, it-services

Extract through conversation: service type, location (city), budget (INR),
timeline, duration, special requirements.

Ask ONE question at a time. Be friendly. Support Hinglish (Hindi+English mix).
Keep replies under 80 words.

When you have enough info (at minimum: category + location + rough budget), end with:
EXTRACTED:{"title":"...","category_slug":"...","description":"...","location_text":"...","city":"...","budget_min":null,"budget_max":null,"budget_type":"negotiable","duration":"...","requirements":"...","start_date":null}

Only include the EXTRACTED: line when you have sufficient info to create a job posting.`

export async function jobIntakeChat(
  history: ChatMessage[],
  userMessage: string
): Promise<{ reply: string; extracted: ExtractedJob | null; isComplete: boolean }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: JOB_INTAKE_SYSTEM },
    { role: 'assistant', content: 'Namaste! I am GigMind AI. Tell me what service you need and I will help you find the right professional. Aap Hindi ya English mein bhi baat kar sakte hain!' },
    ...history.map(m => ({ role: m.role === 'model' ? 'assistant' as const : 'user' as const, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const completion = await groq.chat.completions.create({
    messages,
    model: 'llama-3.1-8b-instant',
    max_tokens: 500,
    temperature: 0.7,
  })

  const fullText = completion.choices[0]?.message?.content || ''

  let extracted: ExtractedJob | null = null
  let isComplete = false

  if (fullText.includes('EXTRACTED:')) {
    try {
      const jsonStr = fullText.split('EXTRACTED:')[1].trim()
      extracted = JSON.parse(jsonStr)
      isComplete = true
    } catch {
      // JSON parse failed, return reply without extraction
    }
  }

  return {
    reply: fullText.split('EXTRACTED:')[0].trim(),
    extracted,
    isComplete,
  }
}

export async function generateProviderBio(qa: Record<string, string>): Promise<string> {
  const prompt = `Write a professional provider bio for GigMind marketplace:
Name: ${qa.name}, Service: ${qa.service}, Experience: ${qa.experience} years,
Skills: ${qa.skills}, Location: ${qa.location}, Strengths: ${qa.strengths}

Write a warm 3-paragraph bio under 200 words. First person. Simple English.
Paragraph 1: Introduction + experience
Paragraph 2: Skills and specializations
Paragraph 3: Work style + why clients should hire them`

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'mixtral-8x7b-32768',
    max_tokens: 400,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || ''
}

export async function generateProposal(
  jobTitle: string,
  jobDesc: string,
  providerBio: string,
  skills: string[],
  amount: number,
  timeline: string
): Promise<string> {
  const prompt = `Write a 120-150 word job proposal for GigMind marketplace:
Job: ${jobTitle} — ${jobDesc}
Provider: ${providerBio}
Skills: ${skills.join(', ')}
Proposed: ₹${amount}, Timeline: ${timeline}

Be specific, professional, first person. Show understanding of the job,
highlight relevant experience, mention the amount naturally, end with clear call to action.`

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'mixtral-8x7b-32768',
    max_tokens: 300,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || ''
}

export function calculateMatchScore(
  provider: {
    avg_rating: number
    total_jobs_done: number
    is_verified: boolean
    plan: string
    service_radius_km: number
  },
  distanceKm: number
): number {
  let score = 0
  score += (provider.avg_rating || 0) * 18
  score += Math.min((provider.total_jobs_done || 0) * 1.5, 30)
  score += provider.is_verified ? 25 : 0
  score += provider.plan === 'pro' ? 15 : provider.plan === 'agency' ? 20 : 0
  score -= Math.min(distanceKm * 0.3, 20)
  return Math.max(0, Math.round(score))
}
