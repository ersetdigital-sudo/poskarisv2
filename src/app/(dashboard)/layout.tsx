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

// ─── Design tokens (inline so this component is self-contained) ───────────────
const T = {
  ink:       '#15181C',
  graphite:  '#2A2F36',
  paper:     '#ECEDE7',
  copper:    '#C6763B',
  signal:    '#4FAE7C',
  inkText:   '#1B1D1F',
  inkMuted:  '#6B7076',
  mono:      'var(--font-jetbrains-mono), monospace',
  sans:      'var(--font-geist-sans), sans-serif',
} as const

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  /* ── loading / not-yet-profile screens ── */
  if (loading) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background: T.paper }}>
        <div style={{ textAlign:'center' }}>
          <span
            style={{
              display:'inline-block', width:28, height:28,
              border:`3px solid ${T.graphite}`, borderTopColor: T.copper,
              borderRadius:'50%', animation:'spin .7s linear infinite',
            }}
          />
          <p style={{ marginTop:12, fontFamily: T.mono, fontSize:11, color: T.inkMuted, letterSpacing:'0.1em' }}>
            MEMUAT...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) return null

  if (!profile) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background: T.paper }}>
        <p style={{ fontFamily: T.mono, fontSize:11, color: T.inkMuted, letterSpacing:'0.1em' }}>MEMUAT PROFIL...</p>
      </div>
    )
  }

  const navItems = getNavItems(profile.role)

  /* ── Sidebar inner ── */
  const Sidebar = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Logo header ── */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `1px solid ${T.graphite}`,
          flexShrink: 0,
        }}
      >
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          {/* Receipt-mark logo — SVG, no external deps */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="2" y="1" width="16" height="17" rx="1" stroke={T.copper} strokeWidth="1.4"/>
            <line x1="6" y1="5.5"  x2="14" y2="5.5"  stroke={T.copper} strokeWidth="1.1"/>
            <line x1="6" y1="8.5"  x2="14" y2="8.5"  stroke={T.copper} strokeWidth="1.1"/>
            <line x1="6" y1="11.5" x2="10" y2="11.5" stroke={T.copper} strokeWidth="1.1"/>
            <path d="M2 18 L3.5 16.5 L5 18 L6.5 16.5 L8 18 L9.5 16.5 L11 18 L12.5 16.5 L14 18 L15.5 16.5 L17 18 L18 17"
              stroke={T.graphite} strokeWidth="1" fill="none"/>
          </svg>
          <span style={{ fontFamily: T.mono, fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'0.06em' }}>
            KASIR POS
          </span>
        </Link>

        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
          style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:28, height:28, background:'transparent',
            border:'none', cursor:'pointer', color: T.inkMuted,
          }}
          className="lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
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
                background: isActive ? 'rgba(198,118,59,0.10)' : 'transparent',
                transition: 'background 0.12s ease',
              }}
              /* hover via onMouse — avoid CSS-modules overhead */
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
            >
              {/* Copper active bar on the left */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0, top: '20%', bottom: '20%',
                    width: 3,
                    borderRadius: '0 2px 2px 0',
                    background: T.copper,
                  }}
                />
              )}

              <item.icon
                size={15}
                style={{ color: isActive ? T.copper : T.inkMuted, flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: T.sans,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : T.inkMuted,
                  letterSpacing: '0.01em',
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Dotted divider ── */}
      <div
        style={{
          height: 1,
          margin: '0 16px',
          backgroundImage: `repeating-linear-gradient(90deg, ${T.graphite} 0px, ${T.graphite} 5px, transparent 5px, transparent 10px)`,
        }}
      />

      {/* ── User footer ── */}
      <div style={{ padding: '14px 16px', flexShrink: 0 }}>
        {/* Avatar row */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: T.graphite,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.copper }}>
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.name}
            </p>
            <p style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {profile.role}
            </p>
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={() => { signOut(); router.push('/login') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 10px',
            background: 'transparent',
            border: `1px solid ${T.graphite}`,
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'border-color 0.12s ease, background 0.12s ease',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = T.copper
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(198,118,59,0.08)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = T.graphite
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <LogOut size={13} style={{ color: T.inkMuted }} />
          <span style={{ fontFamily: T.sans, fontSize: 12, color: T.inkMuted }}>Keluar</span>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background: T.paper }}>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.55)' }}
          onClick={() => setOpen(false)}
          className="lg:hidden"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 220,
          background: T.ink,
          flexShrink: 0,
          position: 'relative',
          zIndex: 50,
          /* border-right: subtle graphite line */
          borderRight: `1px solid ${T.graphite}`,
          /* On mobile: fixed drawer */
        }}
        className={`
          fixed inset-y-0 left-0 transform transition-transform duration-200
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      {/* ── Main content area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* ── Top bar ── */}
        <header
          style={{
            height: 56,
            background: '#fff',
            borderBottom: `1px solid #E5E6E1`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0,
          }}
        >
          {/* Hamburger — mobile */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="lg:hidden"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:32, height:32, background:'transparent',
              border: `1px solid #E5E6E1`, borderRadius:4,
              cursor:'pointer', color: T.inkMuted,
            }}
          >
            <Menu size={16} />
          </button>

          {/* Breadcrumb / page indicator */}
          <div className="hidden lg:block">
            <span
              style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}
            >
              KASIR POS
            </span>
            <span style={{ margin: '0 6px', color: '#D0D1CC' }}>/</span>
            <span
              style={{ fontFamily: T.mono, fontSize: 10, color: T.copper, letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              {navItems.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
            </span>
          </div>

          {/* Right: user chip */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }} className="hidden sm:block">
              <p style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.inkText }}>{profile.name}</p>
              <p style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{profile.role}</p>
            </div>
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: T.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.copper }}>
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main
          style={{ flex:1, overflowY:'auto', padding:'28px 24px', background: T.paper }}
        >
          {children}
        </main>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
