'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Wrench,
  Laptop,
  Package,
  Receipt,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
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
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
        <div style={{ textAlign:'center' }}>
          <div className="spinner" />
          <p style={{ marginTop:12, fontSize:12, color:'#64748d', letterSpacing:'0.05em' }}>
            Memuat...
          </p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!profile) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
        <p style={{ fontSize:12, color:'#64748d' }}>Memuat profil...</p>
      </div>
    )
  }

  const navItems = getNavItems(profile.role)

  /* ── Sidebar ── */
  const Sidebar = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Logo header */}
      <div style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #533afd 0%, #7c5cfc 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="2" width="14" height="16" rx="1.5" stroke="#fff" strokeWidth="1.5"/>
              <line x1="6" y1="6" x2="14" y2="6" stroke="#fff" strokeWidth="1.2"/>
              <line x1="6" y1="9" x2="14" y2="9" stroke="#fff" strokeWidth="1.2"/>
              <line x1="6" y1="12" x2="10" y2="12" stroke="#fff" strokeWidth="1.2"/>
            </svg>
          </div>
          <span style={{ fontSize:14, fontWeight:600, color:'#fcfcfc', letterSpacing:'-0.01em' }}>
            Kasir POS
          </span>
        </Link>

        <button
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
          style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:28, height:28, background:'transparent',
            border:'none', cursor:'pointer', color:'rgba(252,252,252,0.5)',
          }}
          className="lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                marginBottom: 2,
                borderRadius: 4,
                textDecoration: 'none',
                position: 'relative',
                background: isActive ? 'rgba(83,58,253,0.15)' : 'transparent',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
            >
              {/* Active indicator */}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  left: 0, top: '20%', bottom: '20%',
                  width: 3,
                  borderRadius: '0 2px 2px 0',
                  background: '#533afd',
                }} />
              )}

              <item.icon
                size={16}
                style={{ color: isActive ? '#b9b9f9' : 'rgba(252,252,252,0.4)', flexShrink: 0 }}
              />
              <span style={{
                fontSize: 14,
                fontWeight: isActive ? 500 : 300,
                color: isActive ? '#fcfcfc' : 'rgba(252,252,252,0.6)',
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{
        height: 1,
        margin: '0 16px',
        background: 'rgba(255,255,255,0.1)',
      }} />

      {/* User footer */}
      <div style={{ padding: '16px 16px', flexShrink: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(83,58,253,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#b9b9f9' }}>
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#fcfcfc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.name}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(252,252,252,0.4)', textTransform: 'capitalize' }}>
              {profile.role}
            </p>
          </div>
        </div>

        <button
          onClick={() => { signOut(); router.push('/login') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'border-color 120ms ease, background 120ms ease',
            fontSize: 13, fontWeight: 300,
            color: 'rgba(252,252,252,0.5)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgba(83,58,253,0.4)'
            el.style.background = 'rgba(83,58,253,0.08)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgba(255,255,255,0.1)'
            el.style.background = 'transparent'
          }}
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:'#f8fafc' }}>

      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(6,27,49,0.5)' }}
          onClick={() => setOpen(false)}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: '#061b31',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50,
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
        className={`
          fixed inset-y-0 left-0 transform transition-transform duration-200
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Top bar — frosted glass */}
        <header className="frosted-glass" style={{
          height: 60,
          borderBottom: '1px solid var(--hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 200,
        }}>
          {/* Hamburger — mobile */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="lg:hidden"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:36, height:36, background:'transparent',
              border: '1px solid var(--hairline)', borderRadius:4,
              cursor:'pointer', color:'var(--mute)',
            }}
          >
            <Menu size={16} />
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex" style={{ alignItems:'center', gap:6 }}>
            <span style={{ fontSize: 12, color:'var(--mute)' }}>
              Kasir POS
            </span>
            <span style={{ color:'var(--hairline)' }}>/</span>
            <span style={{ fontSize: 12, color:'var(--primary)', fontWeight: 500 }}>
              {navItems.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
            </span>
          </div>

          {/* Right: user chip */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right' }} className="hidden sm:block">
              <p style={{ fontSize: 13, fontWeight: 500, color:'var(--ink)' }}>{profile.name}</p>
              <p style={{ fontSize: 11, color:'var(--mute)', textTransform: 'capitalize' }}>{profile.role}</p>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(83,58,253,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color:'var(--primary)' }}>
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px', background:'#f8fafc' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
