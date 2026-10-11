import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    let query = supabaseAdmin
      .from('photos')
      .select('*')
      .order('taken_at', { ascending: true, nullsFirst: false })

    if (tag) query = query.contains('tags', [tag])

    const { data: photos, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ photos: photos || [] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: photo } = await supabaseAdmin
      .from('photos')
      .select('file_name')
      .eq('id', id)
      .single()

    if (photo) {
      await supabaseAdmin.storage.from('travel-photos').remove([photo.file_name])
    }

    const { error } = await supabaseAdmin.from('photos').delete().eq('id', id)

    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
