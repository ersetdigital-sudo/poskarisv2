'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TestWhatsApp() {
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' })
  const [rawResponse, setRawResponse] = useState<string>('')

  async function handleTest() {
    if (!phone) return
    setStatus({ type: 'loading', msg: 'Mengirim...' })
    setRawResponse('')

    try {
      // Baca API key dari settings
      const { data: settings } = await supabase.from('settings').select('key, value').in('key', ['fonnte_api_key'])
      const map: Record<string, string> = {}
      settings?.forEach(row => { map[row.key] = row.value })
      const apiKey = map.fonnte_api_key

      if (!apiKey) {
        setStatus({ type: 'error', msg: 'Fonnte API Key belum diisi di Pengaturan → Toko & Integrasi' })
        return
      }

      // Format nomor
      let formatted = phone.replace(/[^0-9]/g, '')
      if (formatted.startsWith('0')) formatted = '62' + formatted.slice(1)
      if (!formatted.startsWith('62')) formatted = '62' + formatted

      // Kirim test message via API route
      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatted,
          message: 'Test dari Kasir POS -koneksi WhatsApp berhasil!',
        }),
      })

      const result = await res.json()
      setRawResponse(JSON.stringify(result, null, 2))

      if (res.ok && result.success) {
        setStatus({ type: 'success', msg: 'Pesan terkirim! Cek HP kamu.' })
      } else {
        setStatus({ type: 'error', msg: result.error || 'Gagal mengirim' })
      }
    } catch (e) {
      setStatus({ type: 'error', msg: String(e) })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="08123456789"
          className="h-10 flex-1"
        />
        <Button onClick={handleTest} disabled={status.type === 'loading'} className="h-10 gap-2 px-6">
          {status.type === 'loading' ? 'Mengirim...' : 'Test Kirim'}
        </Button>
      </div>

      {status.type !== 'idle' && (
        <div className={`rounded-lg border p-3 text-sm ${
          status.type === 'success' ? 'border-badge-success/30 bg-badge-success/10 text-badge-success' :
          status.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' :
          'border-border bg-secondary/50 text-muted-foreground'
        }`}>
          {status.msg}
        </div>
      )}

      {rawResponse && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Response dari Fonnte:</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-foreground">{rawResponse}</pre>
        </div>
      )}
    </div>
  )
}
