import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const city = searchParams.get('city')
  const budgetMin = searchParams.get('budget_min')
  const budgetMax = searchParams.get('budget_max')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const from = (page - 1) * limit

  let query = supabase
    .from('jobs')
    .select('*, categories(name, slug, icon), profiles(full_name, avatar_url)', { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (category) query = query.eq('categories.slug', category)
  if (city) query = query.ilike('city', `%${city}%`)
  if (budgetMin) query = query.gte('budget_max', parseFloat(budgetMin))
  if (budgetMax) query = query.lte('budget_min', parseFloat(budgetMax))
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)

  const { data: jobs, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: jobs,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, category_id, location_text, city, budget_min, budget_max, budget_type, duration, requirements, start_date, ai_extracted_data } = body

  if (!title || !description || !category_id) {
    return NextResponse.json({ error: 'title, description, and category_id are required' }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      hirer_id: user.id,
      title,
      description,
      category_id,
      location_text: location_text || '',
      city: city || '',
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      budget_type: budget_type || 'negotiable',
      duration: duration || null,
      requirements: requirements || null,
      start_date: start_date || null,
      ai_extracted_data: ai_extracted_data || null,
      status: 'open',
    })
    .select('*, categories(name, slug, icon)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: job }, { status: 201 })
}
