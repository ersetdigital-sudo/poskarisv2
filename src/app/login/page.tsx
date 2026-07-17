'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
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
      minHeight:'100vh',
      background:'var(--background)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24,
      position:'relative',
      overflow:'hidden',
    }}>
      {/* Background gradient orbs */}
      <div style={{
        position:'absolute', top:'-20%', right:'-10%', width:600, height:600,
        borderRadius:'50%', opacity:0.15, pointerEvents:'none',
        background:'radial-gradient(circle, #635bff 0%, transparent 70%)',
      }} />
      <div style={{
        position:'absolute', bottom:'-20%', left:'-10%', width:500, height:500,
        borderRadius:'50%', opacity:0.1, pointerEvents:'none',
        background:'radial-gradient(circle, #a78bfa 0%, transparent 70%)',
      }} />

      <div style={{
        display:'flex', width:'100%', maxWidth:880, minHeight:500,
        borderRadius:20, overflow:'hidden',
        boxShadow:'0 24px 64px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)',
        position:'relative', zIndex:1,
      }}>
        {/* LEFT — Hero */}
        <div style={{
          width:'44%', position:'relative', overflow:'hidden',
          background:'linear-gradient(135deg, #0a2540 0%, #1a3a5c 50%, #635bff 100%)',
          flexDirection:'column', justifyContent:'center',
          padding:'48px 40px',
        }} className="sm-flex">
          {/* Grid pattern overlay */}
          <div style={{
            position:'absolute', inset:0, opacity:0.06,
            backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize:'32px 32px', pointerEvents:'none',
          }} />

          <div style={{ position:'relative', zIndex:1 }}>
            {/* Brand */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:40 }}>
              <div style={{
                width:40, height:40, borderRadius:12,
                background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'1px solid rgba(255,255,255,0.15)',
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="#fff" strokeWidth="1.5"/>
                  <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="6.5" y1="13" x2="10" y2="13" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>Kasir POS</span>
            </div>

            <h1 style={{
              fontSize:36, fontWeight:300, color:'#fff',
              letterSpacing:'-0.72px', lineHeight:1.1, marginBottom:16,
            }}>
              Selamat<br/>
              <span style={{ fontWeight:600 }}>Datang Kembali</span>
            </h1>

            <p style={{
              fontSize:15, fontWeight:400, color:'rgba(255,255,255,0.55)',
              lineHeight:1.6, maxWidth:280, marginBottom:40,
            }}>
              Kelola servis, stok, dan laporan keuangan toko laptop Anda dalam satu platform.
            </p>

            {/* Stats preview */}
            <div style={{ display:'flex', gap:20 }}>
              {[
                { label: 'Servis', val: '120+' },
                { label: 'Unit', val: '45+' },
                { label: 'Laporan', val: 'Realtime' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding:'12px 16px', borderRadius:10,
                  background:'rgba(255,255,255,0.06)',
                  border:'1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ fontSize:18, fontWeight:600, color:'#fff', lineHeight:1 }}>{s.val}</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div style={{
          flex:1, background:'#fff', display:'flex', flexDirection:'column',
          justifyContent:'center', padding:'48px 44px',
        }}>
          <h2 style={{ fontSize:28, fontWeight:600, color:'var(--ink)', letterSpacing:'-0.56px', marginBottom:6 }}>
            Masuk
          </h2>
          <p style={{ fontSize:14, fontWeight:400, color:'var(--mute)', marginBottom:36 }}>
            Masukkan kredensial untuk melanjutkan
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--charcoal)', marginBottom:8 }}>
                Email
              </label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" required placeholder="nama@toko.com" className="input" />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--charcoal)', marginBottom:8 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input id="login-password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                  required placeholder="••••••••" className="input" style={{ paddingRight:48 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'var(--mute)', padding:4 }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width:'100%', height:48, marginTop:8, fontSize:15 }}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} />
                  Memverifikasi...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <p style={{ marginTop:28, textAlign:'center', fontSize:13, color:'var(--stone)' }}>
            Butuh akses? <span style={{ color:'var(--primary)', fontWeight:500, cursor:'default' }}>Hubungi admin toko</span>
          </p>
        </div>
      </div>
    </div>
  )
}
