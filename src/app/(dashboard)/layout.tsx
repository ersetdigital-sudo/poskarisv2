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
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'

const getNavItems = (role: string) => {
  const baseItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'karyawan'] },
    { href: '/servis', label: 'Servis', icon: Wrench, roles: ['admin', 'karyawan'] },
  ]

  const adminItems = [
    { href: '/unit-laptop', label: 'Unit Laptop', icon: Laptop, roles: ['admin'] },
    { href: '/stok', label: 'Stok Barang', icon: Package, roles: ['admin'] },
    { href: '/operasional', label: 'Operasional', icon: Receipt, roles: ['admin'] },
    { href: '/laporan', label: 'Laporan', icon: BarChart3, roles: ['admin'] },
    { href: '/pengaturan', label: 'Pengaturan', icon: Users, roles: ['admin'] },
  ]

  return [...baseItems, ...adminItems].filter(item => item.roles.includes(role))
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  const navItems = getNavItems(profile.role)

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Laptop className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Kasir POS</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
            </div>
            <button
              onClick={() => {
                signOut()
                router.push('/login')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm font-medium text-blue-700">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
