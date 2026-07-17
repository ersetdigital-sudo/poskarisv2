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
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'var(--surface-subtle)' }}>
        <div className="spinner" />
      </div>
    )
  }
  if (!user) return null
  if (!profile) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'var(--surface-subtle)' }}>
        <p style={{ color:'var(--mute)' }}>Memuat profil...</p>
      </div>
    )
  }

  const navItems = getNavItems(profile.role)
  const currentPage = navItems.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--surface-subtle)' }}>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar-panel ${open ? 'open' : ''}`}
        style={{
          width: 248,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64, display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 20px', borderBottom:'1px solid var(--divider)', flexShrink:0,
        }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{
              width:28, height:28, borderRadius:8,
              background:'var(--primary)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="#fff" strokeWidth="1.5"/>
                <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="6.5" y1="13" x2="10" y2="13" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize:15, fontWeight:600, color:'var(--ink)', letterSpacing:'-0.01em' }}>
              Kasir POS
            </span>
          </Link>
          <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="mobile-only"
            style={{ width:28, height:28, background:'transparent', border:'none', cursor:'pointer', color:'var(--mute)', padding:0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 12px', overflowY:'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 12px', marginBottom:2,
                  borderRadius:8, textDecoration:'none',
                  background: isActive ? 'var(--primary-bg)' : 'transparent',
                  transition:'background 100ms ease',
                }}
              >
                <item.icon size={16} style={{ color: isActive ? 'var(--primary)' : 'var(--mute)', flexShrink:0, strokeWidth: isActive ? 2 : 1.5 }} />
                <span style={{ fontSize:14, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--primary)' : 'var(--body)' }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding:'12px', borderTop:'1px solid var(--divider)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'4px 8px' }}>
            <div style={{
              width:32, height:32, borderRadius:8, background:'var(--surface-muted)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--mute)' }}>
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile.name}</p>
              <p style={{ fontSize:11, color:'var(--subtle)', textTransform:'capitalize' }}>{profile.role}</p>
            </div>
          </div>
          <button onClick={() => { signOut(); router.push('/login') }} className="btn btn-ghost btn-sm"
            style={{ width:'100%', justifyContent:'flex-start' }}>
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Topbar */}
        <header style={{
          height:56, background:'var(--surface)', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px', flexShrink:0,
        }}>
          <button onClick={() => setOpen(true)} aria-label="Buka menu" className="mobile-only"
            style={{ width:32, height:32, background:'transparent', border:'none', cursor:'pointer', color:'var(--mute)', padding:0 }}>
            <Menu size={20} />
          </button>

          <div className="desktop-only" style={{ alignItems:'center', gap:6 }}>
            <span style={{ fontSize:14, color:'var(--subtle)' }}>Kasir POS</span>
            <span style={{ color:'var(--disabled)' }}>/</span>
            <span style={{ fontSize:14, color:'var(--ink)', fontWeight:500 }}>{currentPage?.label ?? 'Dashboard'}</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }} className="sm-block">
              <p style={{ fontSize:13, fontWeight:500, color:'var(--ink)', lineHeight:1.2 }}>{profile.name}</p>
              <p style={{ fontSize:11, color:'var(--subtle)', textTransform:'capitalize' }}>{profile.role}</p>
            </div>
            <div style={{
              width:32, height:32, borderRadius:8, background:'var(--primary-bg)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--primary)' }}>
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', padding:'32px', background:'var(--surface-subtle)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
