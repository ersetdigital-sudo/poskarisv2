'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="var(--primary-foreground)" strokeWidth="1.5"/>
              <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="var(--primary-foreground)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="var(--primary-foreground)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6.5" y1="13" x2="10" y2="13" stroke="var(--primary-foreground)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Selamat datang
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk ke akun Kasir POS Anda
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" required placeholder="nama@toko.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input id="login-password" type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    required placeholder="••••••••" className="pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent p-0 cursor-pointer text-muted-foreground">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Memverifikasi...
                  </span>
                ) : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akses? <span className="font-medium text-primary">Hubungi admin toko</span>
        </p>
      </div>
    </div>
  )
}
