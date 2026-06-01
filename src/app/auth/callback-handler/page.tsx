'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('Callback handler started')
        await new Promise(r => setTimeout(r, 1000))

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          console.log('No session found')
          window.location.href = '/auth/login'
          return
        }

        console.log('Session found:', session.user.email)
        console.log('Calling setup-user API with token...')

        // Access token'ı API'ye gönder
        const response = await fetch('/api/auth/setup-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: session.access_token,
          }),
        })

        const data = await response.json()
        console.log('Setup user result:', data)

        if (data.error) {
          console.error('Setup user error:', data.error)
          window.location.href = '/dashboard'
          return
        }

        if (data.isNew) {
          console.log('New user, redirecting to onboarding')
          window.location.href = '/onboarding'
        } else {
          console.log('Existing user, redirecting to dashboard')
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