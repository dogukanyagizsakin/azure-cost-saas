'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton'

type Resource = {
  id: string
  name: string
  resource_type: string
  resource_group: string
  location: string
  is_active: boolean
  last_seen_at: string
  created_at: string
  cost_snapshots: { cost_usd: number }[]
}

const resourceTypeLabel = (type: string) => {
  if (type.includes('virtualMachines')) return 'Virtual Machine'
  if (type.includes('storageAccounts')) return 'Storage Account'
  if (type.includes('sqlServers')) return 'SQL Server'
  if (type.includes('sites')) return 'App Service'
  if (type.includes('publicIPAddresses')) return 'Public IP'
  if (type.includes('disks')) return 'Disk'
  if (type.includes('networkInterfaces')) return 'Network Interface'
  return type.split('/').pop() || type
}

const resourceTypeColor = (type: string) => {
  if (type.includes('virtualMachines')) return 'bg-blue-900/50 text-blue-400'
  if (type.includes('storageAccounts')) return 'bg-purple-900/50 text-purple-400'
  if (type.includes('sqlServers')) return 'bg-cyan-900/50 text-cyan-400'
  if (type.includes('sites')) return 'bg-green-900/50 text-green-400'
  if (type.includes('publicIPAddresses')) return 'bg-orange-900/50 text-orange-400'
  if (type.includes('disks')) return 'bg-yellow-900/50 text-yellow-400'
  return 'bg-gray-800 text-gray-400'
}

const PAGE_SIZE = 50

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [hasAzure, setHasAzure] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [tenantId, setTenantId] = useState<string | null>(null)

  async function loadResources(currentPage = 0) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single()

      if (!userData) { setHasAzure(false); setLoading(false); return }

      setTenantId(userData.tenant_id)

      const { data: tenant } = await supabase
  .from('tenants')
  .select('azure_subscription_id, azure_client_id')
  .eq('id', userData.tenant_id)
  .single()

// Subscription tablosuna da bak
const { data: subscriptions } = await supabase
  .from('azure_subscriptions')
  .select('id')
  .eq('tenant_id', userData.tenant_id)
  .eq('is_active', true)
  .limit(1)

const hasAzureConnection = !!tenant?.azure_subscription_id ||
  !!tenant?.azure_client_id ||
  (subscriptions && subscriptions.length > 0)

if (!hasAzureConnection) { setHasAzure(false); setLoading(false); return }

      const { data, count } = await supabase
        .from('resources')
        .select('*, cost_snapshots(cost_usd)', { count: 'exact' })
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

      setResources(data || [])
      setTotalCount(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('loadResources error:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources(page)
  }, [page])

  useEffect(() => {
    const channel = supabase
      .channel('resources-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'resources',
      }, () => {
        loadResources(page)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = resources.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.resource_group?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || r.resource_type.includes(filterType)
    return matchSearch && matchType
  })

  const totalCost = resources.reduce((sum, r) => {
    return sum + (r.cost_snapshots?.reduce((s, c) => s + c.cost_usd, 0) || 0)
  }, 0)

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
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="px-6 py-3 text-left">
                    <Skeleton className="h-3 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => <TableRowSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!hasAzure) {
    return (
      <div className="p-6">
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Azure Bağlantısı Gerekli</h2>
          <p className="text-gray-500 text-sm mb-4">Kaynakları görmek için önce Azure subscription&apos;ınızı bağlamanız gerekiyor.</p>
          <a href="/dashboard/settings" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-block">
            Ayarlara Git
          </a>
        </div>
      </div>
    )
  }

  if (resources.length === 0 && page === 0) {
    return (
      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Henüz kaynak yok</h2>
          <p className="text-gray-500 text-sm mb-4">Dashboard&apos;dan &ldquo;Şimdi Tara&rdquo; butonuna tıklayarak Azure kaynaklarınızı tarayın.</p>
          <a href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-block">
            Dashboard&apos;a Git
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Toplam Kaynak</p>
          <p className="text-2xl font-bold text-white">{totalCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Toplam Maliyet</p>
          <p className="text-2xl font-bold text-white">${totalCost.toFixed(0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Aktif</p>
          <p className="text-2xl font-bold text-green-400">{resources.filter(r => r.is_active).length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Resource Group</p>
          <p className="text-2xl font-bold text-white">{new Set(resources.map(r => r.resource_group)).size}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kaynak veya resource group ara..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">Tüm Türler</option>
          <option value="virtualMachines">Virtual Machines</option>
          <option value="storageAccounts">Storage Accounts</option>
          <option value="sqlServers">SQL Servers</option>
          <option value="sites">App Services</option>
          <option value="publicIPAddresses">Public IPs</option>
          <option value="disks">Disks</option>
        </select>
        <span className="text-xs text-gray-500">{filtered.length} kaynak</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-gray-900/50">
              <th className="text-left px-6 py-3 font-medium">Kaynak Adı</th>
              <th className="text-left px-6 py-3 font-medium">Tür</th>
              <th className="text-left px-6 py-3 font-medium">Resource Group</th>
              <th className="text-left px-6 py-3 font-medium">Konum</th>
              <th className="text-left px-6 py-3 font-medium">Maliyet</th>
              <th className="text-left px-6 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const cost = r.cost_snapshots?.reduce((s, c) => s + c.cost_usd, 0) || 0
              return (
                <tr key={r.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{r.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${resourceTypeColor(r.resource_type)}`}>
                      {resourceTypeLabel(r.resource_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{r.resource_group || '-'}</td>
                  <td className="px-6 py-4 text-gray-400">{r.location || '-'}</td>
                  <td className="px-6 py-4">
                    {cost > 0 ? (
                      <span className="text-white font-medium">${cost.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${r.is_active ? 'bg-green-500' : 'bg-gray-600'}`} />
                      <span className={`text-xs ${r.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                        {r.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Arama kriterlerine uygun kaynak bulunamadı</p>
          </div>
        )}

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} / {totalCount} kaynak
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                ← Önceki
              </button>
              <span className="text-xs text-gray-500">
                Sayfa {page + 1} / {Math.ceil(totalCount / PAGE_SIZE)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= totalCount}
                className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sonraki →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}