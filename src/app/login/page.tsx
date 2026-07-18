'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
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
    <div style={{
      minHeight: '100vh', background: 'var(--color-paper)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-sm)',
          }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="var(--color-accent-ink)" strokeWidth="1.5"/>
              <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="var(--color-accent-ink)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="var(--color-accent-ink)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6.5" y1="13" x2="10" y2="13" stroke="var(--color-accent-ink)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-h1" style={{ marginBottom: 4 }}>
            Selamat datang
          </h1>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-ink-3)' }}>
            Masuk ke akun Kasir POS Anda
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div>
              <label htmlFor="login-email" className="text-label" style={{ display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" required placeholder="nama@toko.com" className="input" />
            </div>

            <div>
              <label htmlFor="login-password" className="text-label" style={{ display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input id="login-password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                  required placeholder="••••••••" className="input" style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--color-ink-3)', padding: 4,
                  }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', height: 42, marginTop: 4 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Memverifikasi...
                </span>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p style={{
          marginTop: 'var(--space-lg)', textAlign: 'center',
          fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)',
        }}>
          Belum punya akses?{' '}
          <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Hubungi admin toko</span>
        </p>
      </div>
    </div>
  )
}
