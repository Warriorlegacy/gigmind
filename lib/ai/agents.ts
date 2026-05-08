import Groq from 'groq-sdk'

let groqClient: Groq | null = null

function getGroq() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  return groqClient
}

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
Help users either POST a service requirement or FIND/APPLY to existing jobs.

Available categories: real-estate, medical, home-repair, office-assistance,
interior-design, security, human-resources, cleaning, transport, education,
event-management, it-services

INTENTS:
1. POST JOB: If user wants a service. Extract: title, category, city, budget, etc.
   End with: EXTRACTED:{"title":"...","category_slug":"...","description":"...","location_text":"...","city":"...","budget_min":null,"budget_max":null,"budget_type":"negotiable","duration":"...","requirements":"...","start_date":null}

2. FIND JOB: If user wants to work or apply. Extract: category_slug, city.
   End with: SEARCH_JOBS:{"category_slug":"...","city":"..."}

Ask ONE question at a time. Support Hinglish. Keep replies under 80 words.
Only include the EXTRACTED: or SEARCH_JOBS: line when you have sufficient info.`

export async function jobIntakeChat(
  history: ChatMessage[],
  userMessage: string
): Promise<{ 
  reply: string; 
  extracted: ExtractedJob | null; 
  searchParams: { category_slug?: string; city?: string } | null;
  isComplete: boolean 
}> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: JOB_INTAKE_SYSTEM },
    { role: 'assistant', content: 'Namaste! I am GigMind AI. Tell me what service you need or if you are looking for work, I can help you find jobs. Aap Hindi ya English mein bhi baat kar sakte hain!' },
    ...history.map(m => ({ role: m.role === 'model' ? 'assistant' as const : 'user' as const, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const completion = await getGroq().chat.completions.create({
    messages,
    model: 'llama-3.1-8b-instant',
    max_tokens: 500,
    temperature: 0.7,
  })

  const fullText = completion.choices[0]?.message?.content || ''

  let extracted: ExtractedJob | null = null
  let searchParams: { category_slug?: string; city?: string } | null = null
  let isComplete = false

  if (fullText.includes('EXTRACTED:')) {
    try {
      const jsonStr = fullText.split('EXTRACTED:')[1].trim()
      extracted = JSON.parse(jsonStr)
      isComplete = true
    } catch { }
  } else if (fullText.includes('SEARCH_JOBS:')) {
    try {
      const jsonStr = fullText.split('SEARCH_JOBS:')[1].trim()
      searchParams = JSON.parse(jsonStr)
      isComplete = true
    } catch { }
  }

  return {
    reply: fullText.split('EXTRACTED:')[0].split('SEARCH_JOBS:')[0].trim(),
    extracted,
    searchParams,
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

  const completion = await getGroq().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
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

  const completion = await getGroq().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
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
