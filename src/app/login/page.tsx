'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

// ─── Typed receipt rows ───────────────────────────────────────────────────────
type ReceiptRow =
  | { type: 'header' }
  | { type: 'divider' }
  | { type: 'item'; label: string; value: string; accent?: boolean }
  | { type: 'spacer' }
  | { type: 'status'; label: string; ok: boolean }
  | { type: 'footer' }

const RECEIPT_ROWS: ReceiptRow[] = [
  { type: 'header' },
  { type: 'divider' },
  { type: 'item', label: 'SERVIS', value: '↳ Terima & kelola order' },
  { type: 'item', label: 'UNIT LAPTOP', value: '↳ Jual-beli & inventaris' },
  { type: 'item', label: 'STOK', value: '↳ Spare part & aksesori' },
  { type: 'item', label: 'LABA BERSIH', value: '↳ Laporan real-time' },
  { type: 'divider' },
  { type: 'item', label: 'NOTA', value: '↳ Cetak & kirim via WA', accent: true },
  { type: 'spacer' },
  { type: 'status', label: 'SISTEM', ok: true },
  { type: 'divider' },
  { type: 'footer' },
]

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn }  = useAuth()
  const router      = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email atau password salah')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    /*
     * Full-page background: Ink dark with subtle thermal dot-noise.
     * The login card floats centered — same concept as the reference image
     * but using our Kasir POS palette instead of purple.
     */
    <div
      className="thermal-noise flex min-h-screen items-center justify-center p-4 sm:p-8"
      style={{ background: 'var(--ink)' }}
    >
      {/*
       * CARD — max-w-[860px], two-column on md+, stacked on mobile.
       * No heavy drop-shadow — thin border with Graphite, radius 6px max.
       */}
      <div
        className="flex w-full max-w-[860px] overflow-hidden"
        style={{
          borderRadius: '6px',
          border: '1px solid var(--graphite)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        }}
      >
        {/* ── LEFT PANEL — receipt strip ───────────────────────────────────── */}
        <div
          className="torn-edge-right relative hidden flex-col justify-between px-10 py-10 md:flex md:w-[46%]"
          style={{ background: 'var(--ink)' }}
        >
          {/* Thermal noise is on the outer wrapper; receipt content sits above it */}
          <div className="relative z-10 flex h-full flex-col justify-between">

            {/* Top: receipt ID chip */}
            <div className="print-in">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--copper)',
                }}
              >
                ● REC #001
              </span>
            </div>

            {/* Middle: receipt rows */}
            <div className="flex flex-col gap-0 py-6">
              {RECEIPT_ROWS.map((row, i) => (
                <ReceiptRowItem key={i} row={row} />
              ))}
            </div>

            {/* Bottom: build tag */}
            <div
              className="print-in text-[10px] uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: '#3A3F47',
              }}
            >
              SYS::KASIR-POS-V2 // BUILD 2026
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — login form ─────────────────────────────────────── */}
        <div
          className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-10"
          style={{ background: 'var(--paper)' }}
        >
          {/* Mobile-only brand chip */}
          <div className="mb-6 md:hidden">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.25em]"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--copper)',
              }}
            >
              ● KASIR POS — TOKO LAPTOP
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-[20px] font-bold tracking-[0.06em]"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--ink-text)',
              }}
            >
              SIGN IN
            </h1>
            <p
              className="mt-2 text-[12px] leading-relaxed"
              style={{
                fontFamily: 'var(--font-geist-sans), sans-serif',
                color: '#6B7076',
              }}
            >
              Masuk ke sistem kasir toko laptop Anda.
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Email — floating label */}
            <div className="float-field">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder=" "
                aria-describedby={error ? 'login-error' : undefined}
              />
              <label htmlFor="login-email">Email</label>
            </div>

            {/* Password — floating label */}
            <div className="float-field">
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder=" "
                aria-describedby={error ? 'login-error' : undefined}
              />
              <label htmlFor="login-password">Password</label>
            </div>

            {/* Error message */}
            {error && (
              <div
                id="login-error"
                role="alert"
                className="flex items-center gap-2 border-l-2 py-1 pl-3"
                style={{
                  borderColor: '#ef4444',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: '11px',
                  color: '#ef4444',
                }}
              >
                <span aria-hidden="true">✕</span>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                background: loading ? '#a05a2c' : 'var(--copper)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--copper-lt)'
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--copper)'
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.outline = '3px solid rgba(198,118,59,0.4)'
                ;(e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px'
              }}
              onBlur={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.outline = 'none'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                  />
                  MEMVERIFIKASI...
                </span>
              ) : (
                'MASUK →'
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="mt-8 border-t pt-5"
            style={{ borderColor: '#D0D1CC' }}
          >
            <p
              className="text-center text-[11px]"
              style={{
                fontFamily: 'var(--font-geist-sans), sans-serif',
                color: '#9ca3af',
              }}
            >
              Butuh akses? Hubungi admin toko.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Receipt row renderer ─────────────────────────────────────────────────────
function ReceiptRowItem({ row }: { row: ReceiptRow }) {
  const mono = { fontFamily: 'var(--font-jetbrains-mono), monospace' } as const

  switch (row.type) {
    case 'header':
      return (
        <div className="print-in mb-3">
          <p className="text-[22px] font-bold tracking-[0.08em]" style={{ ...mono, color: '#fff' }}>
            KASIR POS
          </p>
          <p
            className="text-[11px] uppercase tracking-[0.28em]"
            style={{ ...mono, color: '#6b7280' }}
          >
            Toko Laptop — Sistem Internal
          </p>
        </div>
      )

    case 'divider':
      return (
        <div className="print-in my-3">
          <div
            style={{
              height: '1px',
              backgroundImage:
                'repeating-linear-gradient(90deg, #2A2F36 0px, #2A2F36 6px, transparent 6px, transparent 12px)',
              backgroundSize: '12px 1px',
              backgroundRepeat: 'repeat-x',
            }}
          />
        </div>
      )

    case 'item':
      return (
        <div className="print-in flex items-baseline justify-between gap-3 py-[5px]">
          <span
            className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: row.accent ? 'var(--copper)' : '#9ca3af' }}
          >
            {row.label}
          </span>
          <span
            className="text-right text-[11px] leading-snug"
            style={{ ...mono, color: row.accent ? 'var(--copper)' : '#6b7280' }}
          >
            {row.value}
          </span>
        </div>
      )

    case 'spacer':
      return <div className="print-in h-3" />

    case 'status':
      return (
        <div className="print-in flex items-center justify-between py-[5px]">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: '#9ca3af' }}
          >
            {row.label}
          </span>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: row.ok ? 'var(--signal)' : '#ef4444' }}
          >
            {row.ok ? '● ONLINE' : '○ OFFLINE'}
          </span>
        </div>
      )

    case 'footer':
      return (
        <div className="print-in mt-3 text-center">
          <p className="text-[10px] tracking-[0.2em]" style={{ ...mono, color: '#3A3F47' }}>
            * * * &copy;2026 Kasir POS * * *
          </p>
          <p className="mt-1 text-[10px] tracking-widest" style={{ ...mono, color: '#2A2F36' }}>
            TERIMA KASIH ATAS KUNJUNGAN ANDA
          </p>
        </div>
      )

    default:
      return null
  }
}
