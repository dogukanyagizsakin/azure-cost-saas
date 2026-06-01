'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      // Kullanıcı users tablosunda var mı kontrol et
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle()

      // Yoksa tenant ve user oluştur
      if (!existingUser) {
        const email = session.user.email || ''
        const fullName = session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email.split('@')[0]
        const companyDomain = email.split('@')[1]?.split('.')[0] || 'company'
        const slug = companyDomain.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()

        const { data: tenant } = await supabase
          .from('tenants')
          .insert({ name: companyDomain, slug })
          .select()
          .single()

        if (tenant) {
          await supabase.from('users').insert({
            id: session.user.id,
            tenant_id: tenant.id,
            email,
            full_name: fullName,
            role: 'owner',
          })
        }
      }

      // Yeni kullanıcıyı onboarding'e, mevcut kullanıcıyı dashboard'a yönlendir
window.location.href = existingUser ? '/dashboard' : '/onboarding'
    }

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