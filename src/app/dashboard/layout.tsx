'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { AIChat } from '@/components/ui/AIChat'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { toast } from 'sonner'
import Link from 'next/link'
import { logActivity, ActivityActions } from '@/lib/activityLogger'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    activeBg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
  },
  {
    href: '/dashboard/resources',
    label: 'Kaynaklar',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    activeBg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
  },
  {
    href: '/dashboard/recommendations',
    label: 'Öneriler',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    activeBg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
  },
  {
    href: '/dashboard/reports',
    label: 'Raporlar',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    activeBg: 'bg-green-500/20',
    border: 'border-green-500/30',
  },
  {
    href: '/dashboard/finops',
    label: 'FinOps Skoru',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    activeBg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
  },
  {
    href: '/dashboard/savings',
    label: 'Tasarruf Planı',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    activeBg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  {
    href: '/dashboard/settings',
    label: 'Ayarlar',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    activeBg: 'bg-gray-500/20',
    border: 'border-gray-500/30',
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isAzureConnected, setIsAzureConnected] = useState(false)
  const [stats, setStats] = useState({ resources: 0, recommendations: 0 })
  const [scanning, setScanning] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [planInfo, setPlanInfo] = useState<any>(null)

  useEffect(() => {
    // Session dinleyici
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login')
      }
    })

    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      setUser(session.user)

      // Plan kontrolü
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
      })
      if (planRes.ok) {
        const planData = await planRes.json()
        setPlanInfo(planData)
        if (planData.isTrialExpired) {
          window.location.href = '/dashboard/trial-expired'
          return
        }
      }

// Onboarding kontrolü — onboarding sayfasındaysa atlat
if (!window.location.pathname.includes('/dashboard/onboarding')) {
  const onboardingRes = await fetch(`/api/onboarding?accessToken=${session.access_token}`)
  if (onboardingRes.ok) {
    const onboardingData = await onboardingRes.json()
    if (!onboardingData.onboardingCompleted) {
      window.location.href = '/dashboard/onboarding'
      return
    }
  }
}
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('id', session.user.id)
        .single()

      if (!userData) return

      const { data: tenant } = await supabase
        .from('tenants')
        .select('azure_subscription_id')
        .eq('id', userData.tenant_id)
        .single()

      setIsAzureConnected(!!tenant?.azure_subscription_id)

      const { data: resources } = await supabase
        .from('resources')
        .select('id')
        .eq('tenant_id', userData.tenant_id)

      const { data: recs } = await supabase
        .from('recommendations')
        .select('id')
        .eq('tenant_id', userData.tenant_id)
        .eq('status', 'open')

      setStats({
        resources: resources?.length || 0,
        recommendations: recs?.length || 0,
      })
    }

    loadUser()

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await fetch('/api/announcements')
        if (res.ok) {
          const data = await res.json()
          setAnnouncements(data.announcements || [])
        }
      } catch (error) {
        console.error('Announcement load error:', error)
      }
    }
    loadAnnouncements()
  }, [])

  async function handleLogout() {
    await logActivity(ActivityActions.LOGOUT)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleQuickScan() {
    setScanning(true)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token }),
    })
    setScanning(false)
    window.location.reload()
  }

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U'
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Kullanıcı'
  const userEmail = user?.email || ''

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* Sidebar */}
      <aside className={[
        sidebarOpen ? 'w-60' : 'w-16',
        'bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 flex-shrink-0 relative'
      ].join(' ')}>

        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-white font-bold text-base tracking-tight">UnifyTech</span>
                  </div>
                  <p className="text-gray-500 text-xs font-medium tracking-widest uppercase">Cost Pilot</p>
                </div>
              </Link>
            ) : (
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="absolute -right-3 top-5 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white z-10">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Azure Durum */}
        {sidebarOpen && (
          <div className="px-3 pt-3">
            <div className={[
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              isAzureConnected ? 'bg-green-900/20 border border-green-800/30' : 'bg-yellow-900/20 border border-yellow-800/30'
            ].join(' ')}>
              <div className={['w-1.5 h-1.5 rounded-full flex-shrink-0', isAzureConnected ? 'bg-green-500' : 'bg-yellow-500'].join(' ')} />
              <span className={['text-xs font-medium', isAzureConnected ? 'text-green-400' : 'text-yellow-400'].join(' ')}>
                {isAzureConnected ? 'Azure Bağlı' : 'Azure Bağlı Değil'}
              </span>
            </div>
          </div>
        )}

        {/* Hızlı İstatistikler */}
        {sidebarOpen && stats.resources > 0 && (
          <div className="px-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-white">{stats.resources}</p>
                <p className="text-xs text-gray-500">Kaynak</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-yellow-400">{stats.recommendations}</p>
                <p className="text-xs text-gray-500">Öneri</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <p className="text-xs text-gray-600 uppercase tracking-wider px-2 mb-2">Menü</p>
          )}
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={[
                  'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group relative',
                  isActive
                    ? `${item.activeBg} ${item.color} border ${item.border}`
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
                ].join(' ')}
              >
                <div className={['flex-shrink-0 p-1.5 rounded-lg transition-colors', item.color, isActive ? item.bg : ''].join(' ')}>
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.href === '/dashboard/recommendations' && stats.recommendations > 0 && (
                      <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">{stats.recommendations}</span>
                    )}
                    {item.href === '/dashboard/resources' && stats.resources > 0 && (
                      <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">{stats.resources}</span>
                    )}
                  </>
                )}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-l-full bg-current" />
                )}
              </Link>
            )
          })}

          <div className="border-t border-gray-800 my-3" />

          {sidebarOpen && (
            <p className="text-xs text-gray-600 uppercase tracking-wider px-2 mb-2">Hızlı Erişim</p>
          )}

          <button
            onClick={handleQuickScan}
            disabled={scanning || !isAzureConnected}
            title={!sidebarOpen ? 'Hızlı Tara' : undefined}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-gray-800/70 disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="flex-shrink-0 p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              {scanning ? (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            {sidebarOpen && (
              <span className="text-sm font-medium">{scanning ? 'Taranıyor...' : 'Hızlı Tara'}</span>
            )}
          </button>

          <button
            onClick={() => { window.location.href = 'mailto:info@unifytech.com.tr' }}
            title={!sidebarOpen ? 'Destek' : undefined}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-gray-800/70 group"
          >
            <div className="flex-shrink-0 p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {sidebarOpen && <span className="text-sm font-medium">Destek</span>}
          </button>

          {/* Pro'ya Geç — sadece free kullanıcılara */}
          {sidebarOpen && planInfo && !planInfo.isPro && (
            <Link
              href="/dashboard/upgrade"
              className={[
                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group relative',
                pathname === '/dashboard/upgrade'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 border border-yellow-800/20'
              ].join(' ')}
            >
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Pro&apos;ya Geç</span>
              <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full animate-pulse">YENİ</span>
            </Link>
          )}
        </nav>

        {/* Plan Göstergesi */}
        {sidebarOpen && planInfo && (
          <div className="px-3 pb-2">
            {planInfo.isPro ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/30 rounded-xl">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-semibold text-blue-400">Pro Plan</span>
              </div>
            ) : (
              <Link href="/dashboard/upgrade" className="block">
                <div className="px-3 py-2 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/30 rounded-xl hover:border-yellow-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-yellow-400">Free Plan</span>
                    <span className="text-xs text-yellow-400 font-bold">{planInfo.daysLeft} gün</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.max(0, (planInfo.daysLeft / 7) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-yellow-600 mt-1.5">Pro&apos;ya geç →</p>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Kullanıcı Profili */}
        <div className="p-3 border-t border-gray-800">
          <div className={['flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer group', !sidebarOpen ? 'justify-center' : ''].join(' ')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitial}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
                <button onClick={handleLogout} title="Çıkış Yap" className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
          {!sidebarOpen && (
            <button onClick={handleLogout} title="Çıkış Yap" className="w-full flex items-center justify-center p-2 mt-1 rounded-xl text-gray-600 hover:text-red-400 hover:bg-gray-800/70 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white">
              {navItems.find(i => i.href === pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {stats.recommendations > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold" style={{ fontSize: '9px' }}>
                  {stats.recommendations}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Duyuru Banner */}
        {announcements.length > 0 && announcements.map((a: any) => {
          const colors: Record<string, string> = {
            info: 'bg-blue-900/30 border-blue-800/50 text-blue-300',
            warning: 'bg-yellow-900/30 border-yellow-800/50 text-yellow-300',
            success: 'bg-green-900/30 border-green-800/50 text-green-300',
            error: 'bg-red-900/30 border-red-800/50 text-red-300',
          }
          const icons: Record<string, string> = { info: 'ℹ️', warning: '⚠️', success: '✅', error: '🚨' }
          return (
            <div key={a.id} className={`px-6 py-2.5 border-b flex items-center gap-3 ${colors[a.type]}`}>
              <span className="text-sm flex-shrink-0">{icons[a.type]}</span>
              <p className="text-xs font-medium flex-1">{a.title} — {a.message}</p>
            </div>
          )
        })}

        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      <AIChat />
    </div>
  )
}