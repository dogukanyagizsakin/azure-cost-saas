'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="min-h-screen flex">
      {/* Sol panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-black to-black" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Logo alanı - büyük ekran */}
          <div className="flex items-center gap-3 mb-12">
            <span className="text-white font-bold text-4xl tracking-tight">UnifyTech</span>
            <span className="text-gray-400 font-light text-lg tracking-widest mt-1">BİLGİ SİSTEMLERİ</span>
          </div>

          <div className="border-t border-gray-800 w-16 mb-12" />
          <h2 className="text-2xl font-semibold text-white mb-4">Azure Maliyet Yönetimi</h2>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            Azure kaynaklarınızı 8 saatte bir otomatik tarayın, kullanılmayan kaynakları tespit edin ve maliyetlerinizi optimize edin.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 w-full max-w-sm">
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
        </div>
      </div>

      {/* Sağ panel */}
      <div className="w-full lg:w-1/2 bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Logo alanı - mobil */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <span className="text-white font-bold text-3xl tracking-tight">UnifyTech</span>
            <span className="text-gray-400 font-light text-base tracking-widest mt-1">BİLGİ SİSTEMLERİ</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Hoş geldiniz</h1>
            <p className="text-gray-400 mt-1 text-sm">Devam etmek için Microsoft hesabınızla giriş yapın</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

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

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">veya</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="mt-6 bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-gray-300 font-medium">İlk kez mi giriş yapıyorsunuz?</span>
              <br />
              Microsoft hesabınızla giriş yaptığınızda şirket hesabınız otomatik olarak oluşturulur.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500">Güvenli bağlantı</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500">Azure AD korumalı</span>
            </div>
          </div>

          <p className="text-center text-gray-700 text-xs mt-8">© 2025 UnifyTech · Tüm hakları saklıdır</p>
        </div>
      </div>
    </div>
  )
}