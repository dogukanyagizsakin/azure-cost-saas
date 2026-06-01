'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth/login')
          return
        }

        const user = session.user
        const email = user.email || ''
        const fullName = user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split('@')[0]

        // Kullanıcı users tablosunda var mı kontrol et
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, tenant_id')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingUser) {
          // Yeni kullanıcı — tenant oluştur
          const companyDomain = email.split('@')[1]?.split('.')[0] || 'company'
          const slug = companyDomain.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()

          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              name: companyDomain,
              slug,
              is_active: true,
              plan: 'free',
            })
            .select()
            .single()

          if (tenantError) {
            console.error('Tenant oluşturma hatası:', tenantError)
            window.location.href = '/dashboard'
            return
          }

          if (tenant) {
            const { error: userError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                tenant_id: tenant.id,
                email,
                full_name: fullName,
                role: 'owner',
              })

            if (userError) {
              console.error('Kullanıcı oluşturma hatası:', userError)
            }

            // Yeni kullanıcıyı onboarding'e yönlendir
            window.location.href = '/onboarding'
            return
          }
        }

        // Mevcut kullanıcı — dashboard'a git
        window.location.href = '/dashboard'

      } catch (err) {
        console.error('Callback handler hatası:', err)
        window.location.href = '/dashboard'
      }
    }

    setTimeout(handleAuth, 800)
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