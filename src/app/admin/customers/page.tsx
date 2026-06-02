'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

type Customer = {
  id: string
  name: string
  email: string
  is_active: boolean
  azure_connected: boolean
  azure_subscription_id: string
  monthly_budget: number
  resource_count: number
  active_resources: number
  recommendation_count: number
  total_saving: number
  scan_count: number
  last_scan: string | null
  created_at: string
  user_count: number
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-token': token || '' },
    })
    if (res.ok) {
      const data = await res.json()
      setCustomers(data.customers)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${form.name} başarıyla oluşturuldu!`)
        setShowCreateModal(false)
        setForm({ name: '', email: '', password: '', company: '' })
        loadCustomers()
      } else {
        toast.error(data.error || 'Müşteri oluşturulamadı')
      }
    } catch { toast.error('Bağlantı hatası') }
    setCreating(false)
  }

  async function handleToggle(customerId: string, currentStatus: boolean) {
    const token = localStorage.getItem('admin_token')
    const toastId = toast.loading(currentStatus ? 'Pasif ediliyor...' : 'Aktif ediliyor...')
    const res = await fetch('/api/admin/toggle-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
      body: JSON.stringify({ tenantId: customerId, isActive: !currentStatus }),
    })
    if (res.ok) {
      toast.success(currentStatus ? 'Müşteri pasif edildi' : 'Müşteri aktif edildi', { id: toastId })
      loadCustomers()
    } else {
      toast.error('İşlem başarısız', { id: toastId })
    }
  }

  async function handleDelete() {
    if (!selectedCustomer) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/delete-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
        body: JSON.stringify({ tenantId: selectedCustomer.id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Müşteri silindi')
        setShowDeleteModal(false)
        setSelectedCustomer(null)
        loadCustomers()
      } else {
        toast.error(data.error || 'Silinemedi')
      }
    } catch { toast.error('Bağlantı hatası') }
    setDeleting(false)
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' ? true :
      filterStatus === 'active' ? c.is_active :
      filterStatus === 'passive' ? !c.is_active :
      filterStatus === 'azure' ? c.azure_connected : true
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                <span className="text-white font-bold text-sm">Unify</span>
                <span className="text-blue-400 font-light text-sm">Tech</span>
              </div>
              <p className="text-gray-500 text-xs font-medium tracking-widest uppercase">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs text-gray-600 uppercase tracking-wider px-2 mb-2">Menü</p>

          <Link href="/admin/dashboard" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link href="/admin/customers" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Müşteriler</span>
            <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">{customers.length}</span>
          </Link>

          <Link href="/admin/health" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Sistem Sağlığı</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => { document.cookie = 'admin_token=; path=/; max-age=0'; localStorage.clear(); window.location.href = '/admin/login' }}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800/70 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-white">Müşteriler</h1>
            <span className="text-xs text-gray-500">{filtered.length} / {customers.length} müşteri</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="İsim veya email ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-52"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Müşteri
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Toplam Müşteri', value: customers.length, color: 'text-white', sub: 'kayıtlı' },
              { label: 'Aktif Müşteri', value: customers.filter(c => c.is_active).length, color: 'text-green-400', sub: 'aktif hesap' },
              { label: 'Azure Bağlı', value: customers.filter(c => c.azure_connected).length, color: 'text-blue-400', sub: 'bağlantı aktif' },
              { label: 'Toplam Tasarruf', value: `$${customers.reduce((s, c) => s + c.total_saving, 0).toFixed(0)}`, color: 'text-emerald-400', sub: 'potansiyel/ay' },
            ].map((card, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-600 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'active', label: 'Aktif' },
              { key: 'passive', label: 'Pasif' },
              { key: 'azure', label: 'Azure Bağlı' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === f.key ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 border border-gray-800 rounded-2xl">
              <p className="text-gray-500 text-sm mb-4">Müşteri bulunamadı</p>
              <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                Müşteri Ekle
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Müşteri</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Hesap</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Azure</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Kaynak</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Öneri</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Tasarruf</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Son Tarama</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer, i) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                        customer.is_active ? 'hover:bg-gray-800/30' : 'opacity-50 hover:bg-gray-800/20'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            customer.is_active ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-700'
                          }`}>
                            {customer.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          customer.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {customer.is_active ? '● Aktif' : '○ Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          customer.azure_connected ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {customer.azure_connected ? '✓ Bağlı' : '✗ Bağlı Değil'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{customer.resource_count}</td>
                      <td className="px-6 py-4">
                        <span className={customer.recommendation_count > 0 ? 'text-yellow-400 font-medium' : 'text-gray-500'}>
                          {customer.recommendation_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-medium">
                        {customer.total_saving > 0 ? `$${customer.total_saving.toFixed(0)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {customer.last_scan
                          ? new Date(customer.last_scan).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800/30 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Detay
                          </Link>
                          <button
                            onClick={() => handleToggle(customer.id, customer.is_active)}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                              customer.is_active
                                ? 'bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 border-yellow-800/30'
                                : 'bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-800/30'
                            }`}
                          >
                            {customer.is_active ? 'Pasif Et' : 'Aktif Et'}
                          </button>
                          <button
                            onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true) }}
                            className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-800/30 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Yeni Müşteri Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Yeni Müşteri Ekle</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Müşteri email ve şifresiyle giriş yapabilecek</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Ad Soyad</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ahmet Yılmaz" required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ahmet@sirket.com" required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Şirket Adı</label>
                  <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Şirket A.Ş." required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Şifre</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required minLength={6} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                  <p className="text-xs text-gray-600 mt-1">En az 6 karakter · Müşteri bu şifreyle giriş yapacak</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors">İptal</button>
                  <button type="submit" disabled={creating} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    {creating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Oluşturuluyor...</> : 'Müşteri Oluştur'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Silme Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Müşteriyi Sil</h3>
              <p className="text-sm text-gray-400 text-center mb-1">
                <span className="text-white font-medium">{selectedCustomer.name}</span> silinecek.
              </p>
              <p className="text-xs text-red-400/70 text-center mb-6">Tüm veriler kalıcı olarak silinecek!</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors">İptal</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Evet, Sil'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}