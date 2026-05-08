import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeInput } from '@/lib/sanitize'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const city = searchParams.get('city')
  const minRating = searchParams.get('min_rating')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const from = (page - 1) * limit

  let query = supabase
    .from('provider_profiles')
    .select('*, profiles(full_name, avatar_url, city, is_verified, plan), provider_categories(category_id, categories(slug, name, icon))', { count: 'exact' })
    .order('avg_rating', { ascending: false })
    .range(from, from + limit - 1)

  if (minRating) query = query.gte('avg_rating', parseFloat(minRating))
  if (city) query = query.ilike('profiles.city', `%${sanitizeInput(city)}%`)

  const { data: providers, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let filtered = providers || []

  if (category) {
    filtered = filtered.filter((p: any) =>
      p.provider_categories?.some((pc: any) => pc.categories?.slug === category)
    )
  }

  if (search) {
    const s = sanitizeInput(search).toLowerCase()
    filtered = filtered.filter((p: any) =>
      p.profiles?.full_name?.toLowerCase().includes(s) ||
      p.tagline?.toLowerCase().includes(s) ||
      p.bio?.toLowerCase().includes(s)
    )
  }

  return NextResponse.json({
    data: filtered,
    total: count || 0,
    page,
    limit,
  })
}
