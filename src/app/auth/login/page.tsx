'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminForm, setAdminForm] = useState({ email: '', password: '' })
  const [adminLoading, setAdminLoading] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '', password: '' })

  async function handleMicrosoftLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile openid',
        redirectTo: `${window.location.origin}/auth/callback-handler`,
      },
    })
    if (error) {
      setError('Giriş yapılırken hata oluştu.')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback-handler`,
      },
    })
    if (error) {
      setError('Giriş yapılırken hata oluştu.')
      setLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
  e.preventDefault()
  setEmailLoading(true)
  setError('')
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailForm.email,
      password: emailForm.password,
    })

    if (error) {
      if (error.message.includes('banned')) {
        setError('Hesabınız pasif edilmiştir. Lütfen yöneticinizle iletişime geçin.')
      } else {
        setError('Email veya şifre hatalı.')
      }
      setEmailLoading(false)
      return
    }

    if (data.session) {
      const res = await fetch('/api/auth/setup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: data.session.access_token }),
      })
      const setupData = await res.json()

      if (res.status === 403) {
        await supabase.auth.signOut()
        setError(setupData.error || 'Hesabınız pasif edilmiştir.')
        setEmailLoading(false)
        return
      }

      window.location.href = '/dashboard'
    }
  } catch {
    setError('Giriş yapılırken hata oluştu.')
  }
  setEmailLoading(false)
}

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setAdminLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      })
      const data = await response.json()
      if (data.success) {
        document.cookie = `admin_token=${data.token}; path=/; max-age=86400; SameSite=Strict`
        localStorage.setItem('admin_token', data.token)
        localStorage.setItem('admin_name', data.name)
        toast.success(`Hoş geldiniz, ${data.name}!`)
        window.location.href = '/admin/dashboard'
      } else {
        toast.error(data.error || 'Giriş başarısız')
      }
    } catch {
      toast.error('Bağlantı hatası')
    }
    setAdminLoading(false)
  }

  return (
    <div className="min-h-screen flex">

      {/* Sol panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-black to-black" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <span className="text-white font-bold text-4xl tracking-tight">Unify</span>
            <span className="text-blue-400 font-light text-4xl tracking-tight">Tech</span>
            <span className="text-gray-400 font-light text-lg tracking-widest mt-1">BİLGİ SİSTEMLERİ</span>
          </div>

          <div className="border-t border-gray-800 w-16 mb-12" />

          <h2 className="text-2xl font-semibold text-white mb-4">Azure Maliyet Yönetimi</h2>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            Azure kaynaklarınızı otomatik tarayın, kullanılmayan kaynakları tespit edin ve maliyetlerinizi optimize edin.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-8 w-full">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">%40</p>
              <p className="text-xs text-gray-500 mt-1">Ortalama tasarruf</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">8s</p>
              <p className="text-xs text-gray-500 mt-1">Tarama sıklığı</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">7/24</p>
              <p className="text-xs text-gray-500 mt-1">Otomatik izleme</p>
            </div>
          </div>

          {/* Admin Girişi */}
          <div className="mt-16 w-full border-t border-gray-800/50 pt-8">
            <button
              onClick={() => setShowAdminModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white text-sm font-medium py-3 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Yönetici Girişi
            </button>
          </div>

        </div>
      </div>

      {/* Sağ panel */}
      <div className="w-full lg:w-1/2 bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobilde logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <span className="text-white font-bold text-3xl tracking-tight">Unify</span>
            <span className="text-blue-400 font-light text-3xl tracking-tight">Tech</span>
            <span className="text-gray-400 font-light text-base tracking-widest mt-1">BİLGİ SİSTEMLERİ</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Hoş geldiniz</h1>
            <p className="text-gray-400 mt-1 text-sm">Hesabınızla giriş yapın</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Microsoft butonu */}
          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 text-gray-900 font-medium rounded-xl py-3.5 transition-all duration-150 shadow-lg shadow-black/20"
          >
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            {loading ? 'Yönlendiriliyor...' : 'Microsoft ile Giriş Yap'}
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">veya</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Google butonu */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 text-gray-900 font-medium rounded-xl py-3.5 transition-all duration-150 shadow-lg shadow-black/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Yönlendiriliyor...' : 'Google ile Giriş Yap'}
          </button>
<div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">veya email ile giriş</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Email/Şifre Girişi */}
          {!showEmailLogin ? (
            <button
              onClick={() => setShowEmailLogin(true)}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-medium rounded-xl py-3.5 transition-all duration-150"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email ile Giriş Yap
            </button>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                  placeholder="ornek@sirket.com"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Şifre</label>
                <div className="relative">
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailForm.password}
                    onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showEmailPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEmailLogin(false)}
                  className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {emailLoading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Giriş yapılıyor...</>
                  ) : 'Giriş Yap'}
                </button>
              </div>
            </form>
          )}
          <div className="mt-6 bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-gray-300 font-medium">İlk kez mi giriş yapıyorsunuz?</span>
              <br />
              Hesabınızla giriş yaptığınızda şirket hesabınız otomatik olarak oluşturulur. Ek bir kayıt işlemi gerekmez.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500">Güvenli bağlantı</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500">OAuth 2.0 korumalı</span>
            </div>
          </div>

          <p className="text-center text-gray-700 text-xs mt-8">© 2025 UnifyTech · Tüm hakları saklıdır</p>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Yönetici Girişi</p>
                  <p className="text-xs text-gray-500">Admin paneline erişin</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="admin@unifytech.com.tr"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Şifre</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showAdminPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {adminLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Giriş yapılıyor...</>
                ) : 'Giriş Yap'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}