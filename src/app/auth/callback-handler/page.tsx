'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      // Hash fragment'dan session al
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Session check:', session?.user?.email, error?.message)

      if (session) {
        // Session var, dashboard'a git
        window.location.href = '/dashboard'
        return
      }

      // Session yoksa tekrar dene
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      console.log('Refresh check:', data?.session?.user?.email, refreshError?.message)

      if (data?.session) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/auth/login'
      }
    }

    // Kısa bir bekleme ekle — Supabase hash'i parse etmesi için zaman tanı
    setTimeout(handleAuth, 500)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Giriş yapılıyor...</p>
      </div>
    </div>
  )
}