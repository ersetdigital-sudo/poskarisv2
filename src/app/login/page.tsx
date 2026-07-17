'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

// ─── Receipt row types ────────────────────────────────────────────────────────
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

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
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--ink)' }}
    >
      {/* ── LEFT PANEL — receipt strip ─────────────────────────────────────── */}
      <div
        className="torn-edge-right thermal-noise relative hidden overflow-hidden lg:flex lg:w-[52%] lg:flex-col"
        style={{ background: 'var(--ink)' }}
      >
        {/* Receipt paper content — sits above the ::before noise layer */}
        <div className="relative z-10 flex h-full flex-col justify-between px-12 py-10">

          {/* Top logo row */}
          <div className="print-in flex items-baseline gap-3">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.25em]"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--copper)',
              }}
            >
              ● REC #001
            </span>
          </div>

          {/* Receipt rows */}
          <div className="flex flex-col gap-0">
            {RECEIPT_ROWS.map((row, i) => (
              <ReceiptRowItem key={i} row={row} />
            ))}
          </div>

          {/* Bottom corner note */}
          <div
            className="print-in text-[10px] tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              color: '#3A3F47',
            }}
          >
            SYS::KASIR-POS-V2 // BUILD 2026
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — login form ────────────────────────────────────────── */}
      <div
        className="flex flex-1 items-center justify-center px-6 py-12"
        style={{ background: 'var(--paper)' }}
      >
        <div className="w-full max-w-[360px]">

          {/* Mobile header — only visible below lg */}
          <div className="mb-10 lg:hidden">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.25em]"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--copper)',
              }}
            >
              ● KASIR POS
            </p>
            <p
              className="mt-1 text-[10px] uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: '#9ca3af',
              }}
            >
              Toko Laptop
            </p>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h1
              className="text-[22px] font-semibold leading-tight tracking-tight"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--ink-text)',
                letterSpacing: '0.02em',
              }}
            >
              SIGN IN
            </h1>
            <p
              className="mt-2 text-[12px]"
              style={{
                fontFamily: 'var(--font-geist-sans), sans-serif',
                color: '#6b7280',
              }}
            >
              Masukkan kredensial akun Anda untuk melanjutkan.
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-7">
              <label
                htmlFor="email"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: '#6b7280',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="user@tokolaptop.com"
                className="input-underline"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {/* Password */}
            <div className="mb-8">
              <label
                htmlFor="password"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: '#6b7280',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-underline"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                id="login-error"
                role="alert"
                className="mb-5 flex items-center gap-2 border-l-2 pl-3 py-1"
                style={{
                  borderColor: '#ef4444',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: '12px',
                  color: '#ef4444',
                }}
              >
                <span aria-hidden="true">✕</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                background: loading ? '#a05a2c' : 'var(--copper)',
                color: '#fff',
                border: 'none',
                borderRadius: 0,
                cursor: loading ? 'not-allowed' : 'pointer',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--copper-lt)'
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--copper)'
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(198,118,59,0.35)'
              }}
              onBlur={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
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

          {/* Footer note */}
          <div
            className="mt-10 border-t pt-5"
            style={{ borderColor: '#d1d5d0' }}
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
          <p
            className="text-[22px] font-bold tracking-[0.08em]"
            style={{ ...mono, color: '#fff' }}
          >
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
          {/* Dotted line — mimics thermal receipt perforation */}
          <div
            className="w-full"
            style={{
              borderTop: '1px dashed #2A2F36',
              /* extra gap dots via repeating gradient */
              backgroundImage:
                'repeating-linear-gradient(90deg, #2A2F36 0px, #2A2F36 6px, transparent 6px, transparent 12px)',
              backgroundSize: '12px 1px',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'center',
              height: '1px',
              border: 'none',
            }}
          />
        </div>
      )

    case 'item':
      return (
        <div className="print-in flex items-baseline justify-between gap-4 py-[5px]">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em] whitespace-nowrap"
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
          <p
            className="text-[10px] tracking-[0.2em]"
            style={{ ...mono, color: '#3A3F47' }}
          >
            * * * &copy;2026 Kasir POS * * *
          </p>
          <p
            className="mt-1 text-[10px] tracking-widest"
            style={{ ...mono, color: '#2A2F36' }}
          >
            TERIMA KASIH ATAS KUNJUNGAN ANDA
          </p>
        </div>
      )

    default:
      return null
  }
}
