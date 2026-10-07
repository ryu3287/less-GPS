import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: photos, error } = await supabaseAdmin
      .from('photos')
      .select('tags')

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    const tagCounts: Record<string, number> = {}
    for (const photo of photos || []) {
      for (const tag of photo.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }

    const tags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({ tags })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
