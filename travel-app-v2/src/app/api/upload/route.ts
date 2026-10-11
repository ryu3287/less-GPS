import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeImageWithVision } from '@/lib/vision'
import { extractExifFromBuffer } from '@/lib/exif'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const exif = await extractExifFromBuffer(buffer)

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('travel-photos')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('travel-photos')
      .getPublicUrl(fileName)

    const base64 = buffer.toString('base64')
    const tags = await analyzeImageWithVision(base64)

    const { data: photo, error: dbError } = await supabaseAdmin
      .from('photos')
      .insert({
        file_name: file.name,
        storage_url: urlData.publicUrl,
        taken_at: exif.taken_at,
        latitude: exif.latitude,
        longitude: exif.longitude,
        tags,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
