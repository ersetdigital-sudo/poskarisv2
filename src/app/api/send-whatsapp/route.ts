import { NextRequest, NextResponse } from 'next/server'

// POST /api/send-whatsapp
// Body: { phone: string, message: string, filename: string, fileBase64: string }
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FONNTE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FONNTE_API_KEY belum dikonfigurasi di environment variables' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { phone, message, filename, fileBase64 } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'phone dan message wajib diisi' },
        { status: 400 }
      )
    }

    // Format nomor: hapus +62/0 di depan, ganti dengan 62
    let formattedPhone = phone.replace(/[^0-9]/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1)
    }
    if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone
    }

    // Kirim via Fonnte API
    const formData = new FormData()
    formData.append('target', formattedPhone)
    formData.append('message', message)

    // Jika ada file PDF, attach sebagai document
    if (fileBase64 && filename) {
      const buffer = Buffer.from(fileBase64, 'base64')
      const blob = new Blob([buffer], { type: 'application/pdf' })
      formData.append('file', blob, filename)
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.reason || 'Gagal mengirim pesan', details: result },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
