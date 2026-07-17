'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Wrench, Laptop, Package, Receipt,
  BarChart3, Users, LogOut, Menu, X, ChevronRight,
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
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'var(--background)' }}>
        <div style={{ textAlign:'center' }}>
          <div className="spinner" />
          <p style={{ marginTop:16, fontSize:13, color:'var(--mute)' }}>Memuat...</p>
        </div>
      </div>
    )
  }
  if (!user) return null
  if (!profile) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'var(--background)' }}>
        <p style={{ fontSize:13, color:'var(--mute)' }}>Memuat profil...</p>
      </div>
    )
  }

  const navItems = getNavItems(profile.role)

  const Sidebar = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{
        height: 68, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0,
      }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg, #635bff 0%, #a78bfa 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 12px rgba(99,91,255,0.3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="#fff" strokeWidth="1.5"/>
              <line x1="6.5" y1="6" x2="13.5" y2="6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6.5" y1="9.5" x2="13.5" y2="9.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6.5" y1="13" x2="10" y2="13" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-0.02em', display:'block', lineHeight:1.2 }}>
              Kasir POS
            </span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:400, letterSpacing:'0.03em' }}>
              Toko Laptop
            </span>
          </div>
        </Link>
        <button onClick={() => setOpen(false)} aria-label="Tutup menu"
          className="mobile-only"
          style={{ width:28, height:28, background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)' }}><X size={16} /></button>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 12px', overflowY:'auto' }}>
        <p style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em', textTransform:'uppercase', padding:'0 12px', marginBottom:8 }}>
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 12px', marginBottom:2,
                borderRadius:10, textDecoration:'none', position:'relative',
                background: isActive ? 'rgba(99,91,255,0.12)' : 'transparent',
                transition:'all 180ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {isActive && (
                <span style={{
                  position:'absolute', left:0, top:'15%', bottom:'15%', width:3,
                  borderRadius:'0 3px 3px 0', background:'var(--gradient-primary)',
                }} />
              )}
              <item.icon size={18} style={{ color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.3)', flexShrink:0 }} />
              <span style={{ fontSize:14, fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', flex:1 }}>
                {item.label}
              </span>
              {isActive && <ChevronRight size={14} style={{ color:'rgba(255,255,255,0.2)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ height:1, margin:'0 16px', background:'rgba(255,255,255,0.06)' }} />

      {/* User footer */}
      <div style={{ padding:'16px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg, rgba(99,91,255,0.2) 0%, rgba(167,139,250,0.2) 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#a78bfa' }}>
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile.name}</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'capitalize' }}>{profile.role}</p>
          </div>
        </div>
        <button onClick={() => { signOut(); router.push('/login') }}
          style={{
            display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 12px',
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)',
            borderRadius:10, cursor:'pointer', transition:'all 180ms ease',
            fontSize:13, fontWeight:400, color:'rgba(255,255,255,0.45)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(237,95,116,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(237,95,116,0.2)'; (e.currentTarget as HTMLElement).style.color = '#ed5f74' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}
        >
          <LogOut size={15} /><span>Keluar</span>
        </button>
      </div>
    </div>
  )

  const currentPage = navItems.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--background)' }}>
      {/* Mobile overlay */}
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        width:260, background:'linear-gradient(180deg, #0a2540 0%, #051c30 100%)',
        flexShrink:0,
        borderRight:'1px solid rgba(255,255,255,0.04)',
      }}
        className={`sidebar-panel ${open ? 'open' : ''}`}
      >
        <Sidebar />
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Topbar */}
        <header className="glass" style={{
          height:64, borderBottom:'1px solid var(--hairline)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', flexShrink:0, position:'sticky', top:0, zIndex:200,
        }}>
          <button onClick={() => setOpen(true)} aria-label="Buka menu" className="mobile-only"
            style={{ width:36, height:36, background:'transparent', border:'1px solid var(--hairline)', borderRadius:8, cursor:'pointer', color:'var(--mute)' }}>
            <Menu size={16} />
          </button>

          <div className="desktop-only" style={{ alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, color:'var(--mute)' }}>Kasir POS</span>
            <ChevronRight size={14} style={{ color:'var(--stone)' }} />
            <span style={{ fontSize:13, color:'var(--primary)', fontWeight:600 }}>{currentPage?.label ?? 'Dashboard'}</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ textAlign:'right' }} className="sm-block">
              <p style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{profile.name}</p>
              <p style={{ fontSize:11, color:'var(--mute)', textTransform:'capitalize' }}>{profile.role}</p>
            </div>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:'var(--gradient-primary)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 2px 8px rgba(99,91,255,0.2)',
            }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{profile.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', padding:'32px', background:'var(--background)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
