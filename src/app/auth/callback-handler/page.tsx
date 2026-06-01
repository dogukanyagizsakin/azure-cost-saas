'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Session'ın oturması için bekle
        await new Promise(r => setTimeout(r, 1000))

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          console.log('No session, redirecting to login')
          window.location.href = '/auth/login'
          return
        }

        console.log('Session found:', session.user.email)

        // Server-side API ile kullanıcı kaydını oluştur
        const response = await fetch('/api/auth/setup-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const data = await response.json()
        console.log('Setup user result:', data)

        if (data.error) {
          console.error('Setup user error:', data.error)
          // Hata olsa bile dashboard'a gönder
          window.location.href = '/dashboard'
          return
        }

        // Yeni kullanıcıyı onboarding'e, mevcutu dashboard'a yönlendir
        if (data.isNew) {
          window.location.href = '/onboarding'
        } else {
          window.location.href = '/dashboard'
        }

      } catch (err) {
        console.error('Callback error:', err)
        window.location.href = '/dashboard'
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Giriş yapılıyor...</p>
        <p className="text-gray-600 text-xs mt-2">Lütfen bekleyin...</p>
      </div>
    </div>
  )
}