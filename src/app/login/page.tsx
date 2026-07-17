'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Laptop, Shield, BarChart3, Package } from 'lucide-react'

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
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-[55%] overflow-hidden bg-[#0a0f1e] lg:flex lg:flex-col lg:justify-between">
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />

        {/* Top - Logo */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-600/20">
              <Laptop className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-white">Kasir POS</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-blue-400/70">Toko Laptop</p>
            </div>
          </div>
        </div>

        {/* Middle - Hero Content */}
        <div className="relative z-10 px-10">
          <h1 className="mb-3 text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
            Kelola toko laptop<br />
            <span className="text-blue-400">dalam satu tempat.</span>
          </h1>
          <p className="mb-10 max-w-md text-[15px] leading-relaxed text-gray-400">
            Sistem manajemen terpadu untuk servis, jual-beli unit, inventaris stok, dan laporan keuangan. Dirancang untuk operasional harian yang efisien.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            <FeaturePill icon={Shield} label="Role-based Access" />
            <FeaturePill icon={BarChart3} label="Laporan Real-time" />
            <FeaturePill icon={Package} label="Manajemen Stok" />
          </div>
        </div>

        {/* Bottom - Footer */}
        <div className="relative z-10 p-10">
          <p className="text-[11px] font-medium tracking-wide text-gray-600">
            &copy; 2026 Kasir POS &mdash; Sistem Internal Toko
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Laptop className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900">Kasir POS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">
              Masuk ke akun Anda
            </h2>
            <p className="mt-1.5 text-[13px] text-gray-400">
              Masukkan email dan password untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-[3px] focus:ring-blue-500/10"
                placeholder="email@tokolaptop.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-[3px] focus:ring-blue-500/10"
                placeholder="Masukkan password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-[3px] focus:ring-gray-900/20 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memverifikasi...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className="mt-10 border-t border-gray-100 pt-6">
            <p className="text-center text-[12px] text-gray-400">
              Butuh akses? Hubungi admin toko untuk membuat akun.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturePill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-blue-400" />
      <span className="text-[12px] font-medium text-gray-300">{label}</span>
    </div>
  )
}
