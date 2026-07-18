import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabaseAdmin.from('settings').select('key, value')
    if (error) { console.error('Settings fetch error:', error); return {} }
    const map: Record<string, string> = {}
    data?.forEach(row => { map[row.key] = row.value })
    return map
  } catch (e) { console.error('Settings fetch exception:', e); return {} }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, filename, fileBase64 } = body

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone dan message wajib diisi' }, { status: 400 })
    }

    const settings = await getSettings()
    const apiKey = settings.fonnte_api_key || process.env.FONNTE_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        error: 'Fonnte API Key belum dikonfigurasi. Atur di Pengaturan → Toko & Integrasi.',
      }, { status: 500 })
    }

    // Format nomor
    let formattedPhone = phone.replace(/[^0-9]/g, '')
    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1)
    if (!formattedPhone.startsWith('62')) formattedPhone = '62' + formattedPhone

    const formData = new FormData()
    formData.append('target', formattedPhone)
    formData.append('message', message)

    // Upload PDF ke Supabase Storage → dapat URL → kirim URL ke Fonnte
    if (fileBase64 && filename) {
      const buffer = Buffer.from(fileBase64, 'base64')
      const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `nota/${Date.now()}-${cleanFilename}`

      // Upload ke Supabase storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('nota')
        .upload(filePath, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Fallback: kirim tanpa file
      } else {
        // Dapatkan public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('nota')
          .getPublicUrl(filePath)

        if (urlData?.publicUrl) {
          // Kirim URL ke Fonnte (Fonnte akan download dan kirim sebagai file)
          formData.append('url', urlData.publicUrl)
          formData.append('filename', cleanFilename)
        }
      }
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': apiKey },
      body: formData,
    })

    const result = await response.json()
    console.log('Fonnte response:', JSON.stringify(result))

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
