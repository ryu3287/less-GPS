import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// センサーログ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')

    let query = supabaseAdmin
      .from('sensor_logs')
      .select('*')
      .order('timestamp', { ascending: true })

    if (session_id) {
      query = query.eq('session_id', session_id)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ logs: data || [] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// センサーログ保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logs } = body  // 配列でまとめて受け取る

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: 'No logs provided' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('sensor_logs')
      .insert(logs)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, count: logs.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// セッション削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('sensor_logs')
      .delete()
      .eq('session_id', session_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
