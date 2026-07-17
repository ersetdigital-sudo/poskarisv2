'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn } = useAuth()
  const router     = useRouter()

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

  const mono = 'var(--font-jetbrains-mono), monospace'
  const sans = 'var(--font-geist-sans), sans-serif'

  return (
    /* Full-viewport background */
    <div
      style={{
        minHeight: '100vh',
        background: '#7B6FE8',           /* purple — like reference image */
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: sans,
      }}
    >
      {/*
       * CARD — exact proportions from the reference:
       * ~740px wide, split ~42% left / 58% right
       */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: '740px',
          minHeight: '420px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* ══════════════════════════════════════════
            LEFT PANEL — Ink dark, brand + tagline
            (mirrors the "Event Jungle / Hey There!" panel)
        ══════════════════════════════════════════ */}
        <div
          style={{
            width: '42%',
            background: 'var(--ink)',          /* #15181C */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 32px',
            position: 'relative',
            gap: '0',
          }}
          className="hidden sm:flex"
        >
          {/* Brand mark */}
          <div
            style={{
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* Receipt icon — simple monochrome */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="3" y="1" width="16" height="20" rx="1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              <line x1="7" y1="6"  x2="15" y2="6"  stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
              <line x1="7" y1="9"  x2="15" y2="9"  stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
              <line x1="7" y1="12" x2="11" y2="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
              <path d="M3 21 L5 19 L7 21 L9 19 L11 21 L13 19 L15 21 L17 19 L19 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
            </svg>
            <span
              style={{
                fontFamily: mono,
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.1em',
              }}
            >
              Kasir POS
            </span>
          </div>

          {/* Main headline — same energy as "Hey There!" */}
          <h1
            style={{
              fontFamily: mono,
              fontSize: '28px',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            Hai,<br/>Selamat Datang!
          </h1>

          {/* Subtext — matches "Welcome Back. You are just one step away..." */}
          <p
            style={{
              fontFamily: sans,
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: '40px',
            }}
          >
            Sistem kasir & manajemen<br/>toko laptop Anda.
          </p>

          {/* Dotted separator — receipt aesthetic */}
          <div
            style={{
              width: '80%',
              height: '1px',
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 5px, transparent 5px, transparent 10px)',
              marginBottom: '24px',
            }}
          />

          {/* "Don't have an account?" equivalent */}
          <p
            style={{
              fontFamily: sans,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '12px',
            }}
          >
            Belum punya akses?
          </p>

          {/* Outline button — exact style from reference */}
          <button
            type="button"
            style={{
              fontFamily: mono,
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: '#fff',
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: '50px',
              padding: '9px 28px',
              cursor: 'default',
              textTransform: 'uppercase',
            }}
          >
            Hubungi Admin
          </button>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — white form panel
        ══════════════════════════════════════════ */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 44px',
          }}
        >
          {/* SIGN IN heading */}
          <h2
            style={{
              fontFamily: mono,
              fontSize: '18px',
              fontWeight: 700,
              color: '#1B1D1F',
              letterSpacing: '0.12em',
              marginBottom: '28px',
            }}
          >
            SIGN IN
          </h2>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Email field — floating label, matches reference */}
            <FloatField
              id="login-email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            {/* Password field */}
            <FloatField
              id="login-password"
              type="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            {/* Error */}
            {error && (
              <p
                role="alert"
                style={{
                  fontFamily: mono,
                  fontSize: '11px',
                  color: '#ef4444',
                  margin: '-4px 0 0',
                }}
              >
                ✕ {error}
              </p>
            )}

            {/* Submit — rounded pill, Copper, matches "Sign In" button in reference */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '13px',
                background: loading ? '#a05a2c' : 'var(--copper)',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                fontFamily: mono,
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--copper-lt)'
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--copper)'
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.outline = '3px solid rgba(198,118,59,0.35)'
                ;(e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px'
              }}
              onBlur={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.outline = 'none'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  MEMVERIFIKASI...
                </span>
              ) : (
                'MASUK →'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p
            style={{
              marginTop: '24px',
              textAlign: 'center',
              fontFamily: sans,
              fontSize: '11px',
              color: '#9ca3af',
            }}
          >
            Butuh akses? Hubungi admin toko.
          </p>
        </div>
      </div>

      {/* Spin keyframe for loading spinner */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

/* ─── Floating label input component ─────────────────────────────────────── */
function FloatField({
  id,
  type,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  type: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0
  const mono = 'var(--font-jetbrains-mono), monospace'

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Floating label */}
      <label
        htmlFor={id}
        style={{
          position: 'absolute',
          left: '14px',
          top: floated ? '7px' : '50%',
          transform: floated ? 'none' : 'translateY(-50%)',
          fontFamily: mono,
          fontSize: floated ? '9px' : '12px',
          fontWeight: 600,
          color: focused ? 'var(--copper)' : '#9ca3af',
          letterSpacing: floated ? '0.12em' : '0.04em',
          textTransform: floated ? 'uppercase' : 'none',
          pointerEvents: 'none',
          transition: 'top 0.15s ease, font-size 0.15s ease, color 0.15s ease, transform 0.15s ease',
          zIndex: 1,
        }}
      >
        {label}
      </label>

      {/* Input */}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required
        style={{
          width: '100%',
          paddingTop: floated ? '20px' : '13px',
          paddingBottom: floated ? '6px' : '13px',
          paddingLeft: '14px',
          paddingRight: '14px',
          fontFamily: mono,
          fontSize: '13px',
          color: '#1B1D1F',
          background: '#fff',
          border: `1.5px solid ${focused ? 'var(--copper)' : '#e5e7eb'}`,
          borderRadius: '8px',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, padding 0.15s ease',
          boxShadow: focused ? '0 0 0 3px rgba(198,118,59,0.12)' : 'none',
        }}
      />
    </div>
  )
}
