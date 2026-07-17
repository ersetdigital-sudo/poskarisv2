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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '800px',
        minHeight: '460px',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: 'rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px',
      }}>
        {/* ═══ LEFT PANEL — Hero gradient brand moment ═══ */}
        <div
          style={{
            width: '42%',
            background: 'linear-gradient(135deg, #533afd 0%, #7c5cfc 50%, #b9b9f9 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 32px',
            position: 'relative',
          }}
          className="hidden sm:flex"
        >
          {/* Subtle noise texture */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
            pointerEvents: 'none',
          }} />

          {/* Brand mark */}
          <div style={{
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="3" y="2" width="14" height="16" rx="1.5" stroke="#fff" strokeWidth="1.5"/>
                <line x1="6" y1="6" x2="14" y2="6" stroke="#fff" strokeWidth="1.2"/>
                <line x1="6" y1="9" x2="14" y2="9" stroke="#fff" strokeWidth="1.2"/>
                <line x1="6" y1="12" x2="10" y2="12" stroke="#fff" strokeWidth="1.2"/>
              </svg>
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:'#fff', letterSpacing:'-0.01em' }}>
              Kasir POS
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 32,
            fontWeight: 300,
            color: '#fff',
            textAlign: 'center',
            letterSpacing: '-0.64px',
            lineHeight: 1.1,
            marginBottom: 16,
          }}>
            Selamat<br/>Datang Kembali
          </h1>

          <p style={{
            fontSize: 14,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: 220,
          }}>
            Sistem manajemen toko laptop Anda. Kelola servis, stok, dan laporan keuangan.
          </p>

          {/* Divider */}
          <div style={{
            width: '60%',
            height: 1,
            background: 'rgba(255,255,255,0.2)',
            margin: '32px 0',
          }} />

          <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
            Belum punya akses?
          </p>

          <button
            type="button"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              padding: '8px 24px',
              cursor: 'default',
            }}
          >
            Hubungi Admin
          </button>
        </div>

        {/* ═══ RIGHT PANEL — White form ═══ */}
        <div style={{
          flex: 1,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 44px',
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '-0.48px',
            marginBottom: 8,
          }}>
            Masuk
          </h2>
          <p style={{
            fontSize: 14,
            fontWeight: 300,
            color: 'var(--mute)',
            marginBottom: 32,
          }}>
            Masukkan kredensial untuk melanjutkan
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 400,
                color: 'var(--charcoal)',
                marginBottom: 6,
                letterSpacing: '0.02em',
              }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="nama@toko.com"
                className="input"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 400,
                color: 'var(--charcoal)',
                marginBottom: 6,
                letterSpacing: '0.02em',
              }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', height: 44, marginTop: 4, fontSize: 14, fontWeight: 500 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} />
                  Memverifikasi...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <p style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 300,
            color: 'var(--stone)',
          }}>
            Butuh akses? Hubungi admin toko.
          </p>
        </div>
      </div>
    </div>
  )
}
