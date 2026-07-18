'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Wrench, Laptop, Package, Receipt,
  BarChart3, Users, LogOut, Menu, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const getNavItems = (role: string) => {
  const base = [
    { href: '/',           label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin', 'karyawan'] },
    { href: '/servis',     label: 'Servis',      icon: Wrench,          roles: ['admin', 'karyawan'] },
  ]
  const admin = [
    { href: '/unit-laptop', label: 'Unit Laptop', icon: Laptop,   roles: ['admin'] },
    { href: '/stok',        label: 'Stok Barang', icon: Package,  roles: ['admin'] },
    { href: '/operasional', label: 'Operasional', icon: Receipt,  roles: ['admin'] },
    { href: '/laporan',     label: 'Laporan',     icon: BarChart3,roles: ['admin'] },
    { href: '/pengaturan',  label: 'Pengaturan',  icon: Users,    roles: ['admin'] },
  ]
  return [...base, ...admin].filter(i => i.roles.includes(role))
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [storeName, setStoreName] = useState('Kasir POS')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'store_name').maybeSingle()
      .then(({ data }) => { if (data?.value) setStoreName(data.value) })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }
  if (!user) return null
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat profil...</p>
      </div>
    )
  }

  const navItems = getNavItems(profile.role)
  const currentPage = navItems.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'show' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`sidebar-panel ${open ? 'open' : ''} flex w-64 flex-col border-r`}
        style={{
          background: 'var(--sidebar)',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex h-16 items-center justify-between px-5 shrink-0"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="var(--primary-foreground)" strokeWidth="1.5"/>
                <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="var(--primary-foreground)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="var(--primary-foreground)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="6.5" y1="13" x2="10" y2="13" stroke="var(--primary-foreground)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-serif text-lg font-bold tracking-tight text-white">
              {storeName}
            </span>
          </Link>
          <button onClick={() => setOpen(false)} aria-label="Tutup menu"
            className="mobile-only h-7 w-7 border-none bg-transparent p-0 cursor-pointer"
            style={{ color: 'var(--sidebar-foreground)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm no-underline transition-colors min-h-[48px] ${
                  isActive
                    ? 'bg-white/10 font-semibold text-white'
                    : 'font-medium hover:bg-white/5 active:bg-white/10'
                }`}
                style={{ color: isActive ? '#fff' : 'var(--sidebar-foreground)' }}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 p-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <div className="mb-2 flex items-center gap-3 px-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--sidebar-accent)' }}
            >
              <span className="font-serif text-sm font-bold text-primary">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile.name}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--sidebar-foreground)' }}>{profile.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start border-none"
            style={{ color: 'var(--sidebar-foreground)', background: 'transparent' }}
            onClick={() => { signOut(); router.push('/login') }}
          >
            <LogOut size={14} />
            <span>Keluar</span>
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} aria-label="Buka menu" className="lg:hidden flex items-center justify-center h-10 w-10 -ml-1 border-none bg-transparent cursor-pointer text-muted-foreground rounded-lg hover:bg-muted active:bg-muted transition-colors">
              <Menu size={22} />
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Kasir POS</span>
              <span className="text-xs text-muted-foreground/50">/</span>
              <span className="font-serif text-sm font-semibold text-foreground">{currentPage?.label ?? 'Dashboard'}</span>
            </div>

            <div className="lg:hidden">
              <span className="font-serif text-sm font-bold text-foreground">{currentPage?.label ?? 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-foreground leading-tight">{profile.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{profile.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
              <span className="text-sm font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
