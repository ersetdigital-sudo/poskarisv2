'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Wrench, Laptop, Package, Receipt,
  BarChart3, Users, LogOut, Menu, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

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

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-paper)',
      }}>
        <div className="spinner" />
      </div>
    )
  }
  if (!user) return null
  if (!profile) {
    return (
      <div style={{
        display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-paper)',
      }}>
        <p style={{ color: 'var(--color-ink-3)' }}>Memuat profil...</p>
      </div>
    )
  }

  const navItems = getNavItems(profile.role)
  const currentPage = navItems.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-paper)' }}>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar — dark */}
      <aside className={`sidebar-panel ${open ? 'open' : ''}`}
        style={{
          width: 256,
          background: 'var(--color-sidebar)',
          borderRight: '1px solid oklch(25% 0.02 275)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--space-lg)', borderBottom: '1px solid oklch(25% 0.02 275)', flexShrink: 0,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px oklch(54% 0.24 275 / 0.3)',
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="var(--color-accent-ink)" strokeWidth="1.5"/>
                <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="var(--color-accent-ink)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="var(--color-accent-ink)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="6.5" y1="13" x2="10" y2="13" stroke="var(--color-accent-ink)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
              color: '#fff', letterSpacing: 'var(--tracking-tight)',
            }}>
              Kasir POS
            </span>
          </Link>
          <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="mobile-only"
            style={{
              width: 28, height: 28, background: 'transparent', border: 'none',
              cursor: 'pointer', color: 'var(--color-sidebar-text)', padding: 0,
            }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 'var(--space-sm) var(--space-xs)', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', marginBottom: 2,
                  borderRadius: 'var(--radius-md)', textDecoration: 'none',
                  background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                  transition: 'background var(--dur-short) var(--ease-out)',
                  outline: 'none',
                }}
              >
                <item.icon size={18} style={{
                  color: isActive ? '#fff' : 'var(--color-sidebar-text)',
                  flexShrink: 0, strokeWidth: isActive ? 2 : 1.5,
                }} />
                <span style={{
                  fontSize: 'var(--text-body)', fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--color-sidebar-text)',
                }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: 'var(--space-sm)', borderTop: '1px solid oklch(25% 0.02 275)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '4px 8px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--color-sidebar-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 700,
                color: 'var(--color-accent)',
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: 'var(--text-sm)', fontWeight: 500, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{profile.name}</p>
              <p style={{ fontSize: 11, color: 'var(--color-sidebar-text)', textTransform: 'capitalize' }}>{profile.role}</p>
            </div>
          </div>
          <button onClick={() => { signOut(); router.push('/login') }} className="btn btn-ghost btn-sm"
            style={{
              width: '100%', justifyContent: 'flex-start',
              background: 'transparent', color: 'var(--color-sidebar-text)',
              border: 'none',
            }}>
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: 60, background: 'var(--color-paper-2)', borderBottom: '1px solid var(--color-rule)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--space-xl)', flexShrink: 0,
        }}>
          <button onClick={() => setOpen(true)} aria-label="Buka menu" className="mobile-only"
            style={{
              width: 32, height: 32, background: 'transparent', border: 'none',
              cursor: 'pointer', color: 'var(--color-ink-3)', padding: 0,
            }}>
            <Menu size={20} />
          </button>

          <div className="desktop-only" style={{ alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-body)', color: 'var(--color-ink-3)' }}>Kasir POS</span>
            <span style={{ color: 'var(--color-rule-strong)', fontSize: 'var(--text-xs)' }}>/</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-body)',
              color: 'var(--color-ink)', fontWeight: 600,
            }}>{currentPage?.label ?? 'Dashboard'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }} className="sm-block">
              <p style={{
                fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.2,
              }}>{profile.name}</p>
              <p style={{ fontSize: 11, color: 'var(--color-ink-3)', textTransform: 'capitalize' }}>{profile.role}</p>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 700,
                color: 'var(--color-accent)',
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: 'var(--space-xl) var(--space-2xl)',
          background: 'var(--color-paper)',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
