'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Skeleton, RecommendationSkeleton } from '@/components/ui/Skeleton'

type Recommendation = {
  id: string
  type: string
  title: string
  description: string
  estimated_monthly_saving: number
  status: string
  created_at: string
  resources: { name: string; resource_type: string; resource_group: string }
}

const typeLabel: Record<string, string> = {
  idle_vm: 'Boşta VM',
  underused_disk: 'Kullanılmayan Disk',
  orphan_ip: 'Orphan IP',
  overprovisioned: 'Aşırı Boyutlu',
  unused_resource: 'Kullanılmayan Kaynak',
  rightsizing: 'Boyutlandırma',
}

const priorityColor = (saving: number) => {
  if (saving >= 500) return { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Yüksek' }
  if (saving >= 200) return { bg: 'bg-yellow-900/50', text: 'text-yellow-400', label: 'Orta' }
  return { bg: 'bg-gray-800', text: 'text-gray-400', label: 'Düşük' }
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('open')
  const [applying, setApplying] = useState<string | null>(null)

  async function loadRecommendations() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!userData) return

    const { data } = await supabase
      .from('recommendations')
      .select(`*, resources (name, resource_type, resource_group)`)
      .eq('tenant_id', userData.tenant_id)
      .order('estimated_monthly_saving', { ascending: false })

    setRecommendations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadRecommendations()

    const channel = supabase
      .channel('recommendations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recommendations',
      }, () => {
        loadRecommendations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleStatusChange(id: string, status: string) {
    setApplying(id)
    await supabase
      .from('recommendations')
      .update({ status })
      .eq('id', id)

    await loadRecommendations()
    setApplying(null)

    if (status === 'applied') toast.success('Öneri uygulandı olarak işaretlendi!')
    else if (status === 'dismissed') toast.info('Öneri reddedildi')
    else toast.success('Öneri yeniden açıldı')
  }

  const filtered = recommendations.filter(r =>
    filterStatus === 'all' ? true : r.status === filterStatus
  )

  const totalSaving = recommendations
    .filter(r => r.status === 'open')
    .reduce((sum, r) => sum + r.estimated_monthly_saving, 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <RecommendationSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Henüz öneri yok</h2>
          <p className="text-gray-500 text-sm mb-4">Tarama tamamlandıktan sonra optimizasyon önerileri burada görünecek.</p>
          <a href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-block">
            Taramayı Başlat
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Toplam Öneri</p>
          <p className="text-2xl font-bold text-white">{recommendations.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Açık Öneri</p>
          <p className="text-2xl font-bold text-yellow-400">{recommendations.filter(r => r.status === 'open').length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Uygulanan</p>
          <p className="text-2xl font-bold text-green-400">{recommendations.filter(r => r.status === 'applied').length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Potansiyel Tasarruf</p>
          <p className="text-2xl font-bold text-green-400">${totalSaving.toFixed(0)}/ay</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'open', label: 'Açık' },
          { key: 'applied', label: 'Uygulanan' },
          { key: 'dismissed', label: 'Reddedilen' },
          { key: 'all', label: 'Tümü' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">{filtered.length} öneri</span>
      </div>

      <div className="space-y-3">
        {filtered.map(r => {
          const priority = priorityColor(r.estimated_monthly_saving)
          return (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${priority.bg} ${priority.text}`}>
                    {priority.label}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium text-sm">{r.title}</p>
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        {typeLabel[r.type] || r.type}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-xs text-gray-500 mb-2">{r.description}</p>
                    )}
                    {r.resources && (
                      <p className="text-xs text-gray-600">
                        <span className="text-gray-500">{r.resources.name}</span>
                        {r.resources.resource_group && <span> · {r.resources.resource_group}</span>}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-green-400 font-semibold text-sm">+${r.estimated_monthly_saving.toFixed(0)}</p>
                    <p className="text-xs text-gray-600">/ay tasarruf</p>
                  </div>

                  {r.status === 'open' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(r.id, 'applied')}
                        disabled={applying === r.id}
                        className="text-xs bg-green-900/50 hover:bg-green-900 text-green-400 border border-green-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        {applying === r.id ? (
                          <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Uygula
                      </button>
                      <button
                        onClick={() => handleStatusChange(r.id, 'dismissed')}
                        disabled={applying === r.id}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Reddet
                      </button>
                    </div>
                  )}

                  {r.status === 'applied' && (
                    <span className="text-xs bg-green-900/30 text-green-400 border border-green-800/50 px-3 py-1.5 rounded-lg">
                      ✓ Uygulandı
                    </span>
                  )}

                  {r.status === 'dismissed' && (
                    <button
                      onClick={() => handleStatusChange(r.id, 'open')}
                      className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                    >
                      Geri Al
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}