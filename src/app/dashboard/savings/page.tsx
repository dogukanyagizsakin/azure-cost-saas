'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

type SavingAction = {
  id: string
  category: string
  title: string
  description: string
  resource: string
  currentCost: number
  savedCost: number
  difficulty: 'Kolay' | 'Orta' | 'Zor'
  priority: 'yüksek' | 'orta' | 'düşük'
  type: string
  applied: boolean
}

const difficultyColor = {
  'Kolay': 'bg-green-900/50 text-green-400',
  'Orta': 'bg-yellow-900/50 text-yellow-400',
  'Zor': 'bg-red-900/50 text-red-400',
}

const categoryIcon: Record<string, string> = {
  'idle_vm': '🖥️',
  'underused_disk': '💾',
  'orphan_ip': '🌐',
  'rightsizing': '📐',
  'reserved_instance': '📅',
  'schedule': '⏰',
  'storage_tier': '📦',
}

const categoryLabel: Record<string, string> = {
  'idle_vm': 'Boşta VM',
  'underused_disk': 'Kullanılmayan Disk',
  'orphan_ip': 'Orphan IP',
  'rightsizing': 'Rightsizing',
  'reserved_instance': 'Reserved Instance',
  'schedule': 'Zamanlama',
  'storage_tier': 'Depolama Katmanı',
}

export default function SavingsPage() {
  const [targetPercent, setTargetPercent] = useState(20)
  const [currentCost, setCurrentCost] = useState(0)
  const [actions, setActions] = useState<SavingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!userData) return

    const { data: resources } = await supabase
      .from('resources')
      .select('*, cost_snapshots(cost_usd)')
      .eq('tenant_id', userData.tenant_id)

    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('*, resources(name, resource_type, resource_group)')
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'open')
      .order('estimated_monthly_saving', { ascending: false })

    const total = resources?.reduce((sum, r) =>
      sum + (r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0), 0) || 0

    setCurrentCost(total)

    // Önerilerden aksiyonlar oluştur
    const baseActions: SavingAction[] = recommendations?.map((rec, i) => ({
      id: rec.id,
      category: rec.type,
      title: rec.title,
      description: rec.description || '',
      resource: rec.resources?.name || 'Bilinmiyor',
      currentCost: rec.estimated_monthly_saving / 0.8,
      savedCost: rec.estimated_monthly_saving,
      difficulty: rec.estimated_monthly_saving > 500 ? 'Orta' : 'Kolay',
      priority: rec.estimated_monthly_saving >= 500 ? 'yüksek' : rec.estimated_monthly_saving >= 200 ? 'orta' : 'düşük',
      type: rec.type,
      applied: false,
    })) || []

    // Ek statik öneriler ekle
    const extraActions: SavingAction[] = [
      {
        id: 'reserved-1',
        category: 'reserved_instance',
        title: 'Reserved Instance\'a Geçiş',
        description: 'VM\'lerinizi 1 yıllık Reserved Instance\'a geçirerek %40\'a kadar tasarruf edin.',
        resource: 'Tüm VM\'ler',
        currentCost: total * 0.4,
        savedCost: total * 0.4 * 0.4,
        difficulty: 'Orta',
        priority: 'yüksek',
        type: 'reserved_instance',
        applied: false,
      },
      {
        id: 'schedule-1',
        category: 'schedule',
        title: 'Test Ortamlarını Gece Kapat',
        description: 'Dev/Test VM\'lerini mesai saatleri dışında (18:00-09:00) otomatik kapatın.',
        resource: 'Dev/Test VM\'leri',
        currentCost: total * 0.2,
        savedCost: total * 0.2 * 0.65,
        difficulty: 'Kolay',
        priority: 'orta',
        type: 'schedule',
        applied: false,
      },
      {
        id: 'storage-1',
        category: 'storage_tier',
        title: 'Depolama Katmanını Düşür',
        description: 'Nadiren erişilen verileri Cool veya Archive katmanına taşıyın.',
        resource: 'Storage Account\'lar',
        currentCost: total * 0.1,
        savedCost: total * 0.1 * 0.5,
        difficulty: 'Kolay',
        priority: 'düşük',
        type: 'storage_tier',
        applied: false,
      },
    ]

    setActions([...baseActions, ...extraActions])
    setLoading(false)
  }

  function generatePlan() {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setPlanGenerated(true)
      toast.success('Tasarruf planı oluşturuldu!')
    }, 1500)
  }

  function toggleApplied(id: string) {
    setActions(prev => prev.map(a =>
      a.id === id ? { ...a, applied: !a.applied } : a
    ))
  }

  const targetSaving = currentCost * (targetPercent / 100)
  const filteredActions = filter === 'all'
    ? actions
    : filter === 'applied'
    ? actions.filter(a => a.applied)
    : actions.filter(a => a.priority === filter)

  const totalPotential = actions.reduce((sum, a) => sum + a.savedCost, 0)
  const appliedSaving = actions.filter(a => a.applied).reduce((sum, a) => sum + a.savedCost, 0)
  const progress = targetSaving > 0 ? Math.min((totalPotential / targetSaving) * 100, 100) : 0

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">

      {/* Başlık */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-1">Tasarruf Planı</h2>
        <p className="text-sm text-gray-500">Hedef belirleyin, sistem size özel tasarruf planı oluştursun</p>
      </div>

      {/* Hedef Belirleme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6"
      >
        <h3 className="text-sm font-semibold text-white mb-4">Aylık Tasarruf Hedefiniz</h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Tasarruf Hedefi</span>
              <span className="text-lg font-bold text-white">%{targetPercent}</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={targetPercent}
              onChange={e => setTargetPercent(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>%5</span>
              <span>%60</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl p-4 text-center min-w-36">
              <p className="text-xs text-gray-500 mb-1">Mevcut Maliyet</p>
              <p className="text-xl font-bold text-white">
                {currentCost > 0 ? `$${currentCost.toFixed(0)}` : 'N/A'}
              </p>
              <p className="text-xs text-gray-600">/ay</p>
            </div>
            <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 text-center min-w-36">
              <p className="text-xs text-gray-500 mb-1">Hedef Tasarruf</p>
              <p className="text-xl font-bold text-green-400">
                {currentCost > 0 ? `$${targetSaving.toFixed(0)}` : `%${targetPercent}`}
              </p>
              <p className="text-xs text-gray-600">/ay</p>
            </div>
          </div>
        </div>

        <button
          onClick={generatePlan}
          disabled={generating}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Plan Oluşturuluyor...</>
          ) : (
            <><span>✨</span> %{targetPercent} Tasarruf Planı Oluştur</>
          )}
        </button>
      </motion.div>

      {/* Özet Kartlar */}
      {planGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Toplam Potansiyel</p>
            <p className="text-2xl font-bold text-green-400">${totalPotential.toFixed(0)}</p>
            <p className="text-xs text-gray-600">/ay tasarruf</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Aksiyon Sayısı</p>
            <p className="text-2xl font-bold text-white">{actions.length}</p>
            <p className="text-xs text-gray-600">öneri</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Uygulanan</p>
            <p className="text-2xl font-bold text-blue-400">{actions.filter(a => a.applied).length}</p>
            <p className="text-xs text-green-600">+${appliedSaving.toFixed(0)}/ay</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Hedefe Ulaşım</p>
            <p className="text-2xl font-bold text-white">%{Math.round(progress)}</p>
            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Tasarruf Aksiyonları */}
      {planGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Filtreler */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'yüksek', label: 'Yüksek Öncelik' },
              { key: 'orta', label: 'Orta Öncelik' },
              { key: 'düşük', label: 'Düşük Öncelik' },
              { key: 'applied', label: 'Uygulandı' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-xs text-gray-500 ml-2">{filteredActions.length} aksiyon</span>
          </div>

          {/* Aksiyon Listesi */}
          <div className="space-y-3">
            {filteredActions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-gray-900 border rounded-xl p-5 transition-all ${
                  action.applied
                    ? 'border-green-800/50 bg-green-900/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl flex-shrink-0 mt-0.5">
                      {categoryIcon[action.category] || '💡'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-white">{action.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor[action.difficulty]}`}>
                          {action.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          action.priority === 'yüksek' ? 'bg-red-900/50 text-red-400' :
                          action.priority === 'orta' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {action.priority}
                        </span>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {categoryLabel[action.category] || action.category}
                        </span>
                      </div>
                      {action.description && (
                        <p className="text-xs text-gray-500 mb-1">{action.description}</p>
                      )}
                      <p className="text-xs text-gray-600">
                        Kaynak: <span className="text-gray-400">{action.resource}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">+${action.savedCost.toFixed(0)}</p>
                      <p className="text-xs text-gray-600">/ay tasarruf</p>
                    </div>
                    <button
                      onClick={() => toggleApplied(action.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        action.applied
                          ? 'bg-green-900/50 text-green-400 border border-green-800'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {action.applied ? '✓ Uygulandı' : 'Uygula'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {action.currentCost > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-800/50">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Mevcut: ${action.currentCost.toFixed(0)}/ay</span>
                      <span>Sonra: ${(action.currentCost - action.savedCost).toFixed(0)}/ay</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full"
                        style={{ width: `${Math.min((action.savedCost / action.currentCost) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Toplam Özet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-gradient-to-r from-blue-900/30 to-green-900/30 border border-blue-800/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Toplam Potansiyel Tasarruf</p>
                <p className="text-3xl font-bold text-green-400">${totalPotential.toFixed(0)}/ay</p>
                <p className="text-xs text-gray-500 mt-1">
                  Yıllık: <span className="text-green-400 font-medium">${(totalPotential * 12).toFixed(0)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Hedefiniz</p>
                <p className="text-2xl font-bold text-white">%{targetPercent} azalma</p>
                <p className="text-xs text-gray-500 mt-1">
                  = ${targetSaving.toFixed(0)}/ay tasarruf
                </p>
              </div>
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Hedefe ilerleme</span>
                  <span>%{Math.round(Math.min((totalPotential / (targetSaving || 1)) * 100, 100))}</span>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      progress >= 100 ? 'bg-green-500' :
                      progress >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalPotential / (targetSaving || 1)) * 100, 100)}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
                {totalPotential >= targetSaving && targetSaving > 0 && (
                  <p className="text-xs text-green-400 mt-1.5">
                    ✓ Hedefnize ulaşmak için yeterli tasarruf fırsatı mevcut!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}