import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Pakai service_role_key di server-side supaya bisa baca settings tanpa RLS block
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabaseAdmin.from('settings').select('key, value')
    if (error) {
      console.error('Settings fetch error:', error)
      return {}
    }
    const map: Record<string, string> = {}
    data?.forEach(row => { map[row.key] = row.value })
    return map
  } catch (e) {
    console.error('Settings fetch exception:', e)
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, filename, fileBase64 } = body

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone dan message wajib diisi' }, { status: 400 })
    }

    // Baca API key dari settings DB (prioritas) atau env var (fallback)
    const settings = await getSettings()
    const apiKey = settings.fonnte_api_key || process.env.FONNTE_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        error: 'Fonnte API Key belum dikonfigurasi. Atur di Pengaturan → Toko & Integrasi.',
        debug: { settingsKeys: Object.keys(settings), hasEnvKey: !!process.env.FONNTE_API_KEY }
      }, { status: 500 })
    }

    // Format nomor: hapus karakter non-digit, ganti 0 di depan dengan 62
    let formattedPhone = phone.replace(/[^0-9]/g, '')
    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1)
    if (!formattedPhone.startsWith('62')) formattedPhone = '62' + formattedPhone

    const formData = new FormData()
    formData.append('target', formattedPhone)
    formData.append('message', message)

    // Attach PDF jika ada
    if (fileBase64 && filename) {
      const buffer = Buffer.from(fileBase64, 'base64')
      const blob = new Blob([buffer], { type: 'application/pdf' })
      formData.append('file', blob, filename)
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': apiKey },
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        error: result.reason || result.message || 'Gagal mengirim pesan via Fonnte',
        details: result
      }, { status: response.status })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server: ' + String(error) }, { status: 500 })
  }
}
