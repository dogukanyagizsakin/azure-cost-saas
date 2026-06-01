'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepting'>('loading')
  const [invitation, setInvitation] = useState<any>(null)

  useEffect(() => {
    async function checkInvitation() {
      if (!token) { setStatus('invalid'); return }

      const { data } = await supabase
        .from('invitations')
        .select('*, tenants(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (!data) { setStatus('invalid'); return }

      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) { setStatus('invalid'); return }

      setInvitation(data)
      setStatus('valid')
    }
    checkInvitation()
  }, [token])

  async function handleAccept() {
    setStatus('accepting')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/accept-invite?token=${token}`,
        },
      })
      return
    }

    const { error: userError } = await supabase.from('users').upsert({
      id: user.id,
      tenant_id: invitation.tenant_id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      role: invitation.role,
    })

    if (userError) { setStatus('invalid'); return }

    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('token', token)

    router.push('/dashboard')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Davet Geçersiz</h2>
          <p className="text-gray-500 text-sm mb-6">Bu davet linki geçersiz veya süresi dolmuş.</p>
          <a href="/auth/login" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors inline-block">
            Giriş Sayfasına Dön
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Platforma Davet Edildiniz</h2>
        <p className="text-gray-400 text-sm mb-1">
          <span className="text-white font-medium">{invitation?.tenants?.name}</span> şirketinin
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Azure Cost platformuna <span className="text-blue-400 font-medium">{i