'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [adminNote, setAdminNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => { loadTickets() }, [filter])

  async function loadTickets() {
    setLoading(true)
    const token = localStorage.getItem('admin_token')
    const res = await fetch(`/api/admin/support?status=${filter}`, {
      headers: { 'x-admin-token': token || '' }
    })
    if (res.ok) {
      const data = await res.json()
      setTickets(data.tickets || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }

  async function handleUpdate(ticketId: string, status: string) {
    setUpdating(true)
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
      body: JSON.stringify({ ticketId, status, adminNote }),
    })
    if (res.ok) {
      toast.success('Talep güncellendi!')
      setSelectedTicket(null)
      setAdminNote('')
      loadTickets()
    } else {
      toast.error('Güncellenemedi')
    }
    setUpdating(false)
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: 'Açık', color: 'bg-yellow-900/30 text-yellow-400' },
    in_progress: { label: 'İşlemde', color: 'bg-blue-900/30 text-blue-400' },
    resolved: { label: 'Çözüldü', color: 'bg-green-900/30 text-green-400' },
    closed: { label: 'Kapatıldı', color: 'bg-gray-800 text-gray-500' },
  }

  const categoryLabel: Record<string, string> = {
    technical: '🔧 Teknik',
    billing: '💳 Fatura',
    feature: '💡 Öneri',
    azure: '☁️ Azure',
    general: '📋 Genel',
  }

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
              <span className="text-white font-bold text-sm">UnifyTech</span>
              <p className="text-gray-500 text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { href: '/admin/customers', label: 'Müşteriler', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
            { href: '/admin/support', label: 'Destek Talepleri', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { href: '/admin/health', label: 'Sistem Sağlığı', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { href: '/admin/announcements', label: 'Duyurular', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={[
              'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all',
              item.href === '/admin/support' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
            ].join(' ')}>
              <div className={`p-1.5 rounded-lg ${item.href === '/admin/support' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-800 text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={() => { localStorage.clear(); window.location.href = '/admin/login' }}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800/70 transition-all">
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
          <h1 className="text-sm font-semibold text-white">Destek Talepleri</h1>
          <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded-lg">{total} talep</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Filtreler */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'open', label: 'Açık' },
              { key: 'in_progress', label: 'İşlemde' },
              { key: 'resolved', label: 'Çözüldü' },
              { key: 'closed', label: 'Kapatıldı' },
              { key: 'all', label: 'Tümü' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500">Bu kategoride talep yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-white">{ticket.subject}</p>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{categoryLabel[ticket.category]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.priority === 'high' ? 'bg-red-900/30 text-red-400' : ticket.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                          {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{ticket.company_name} · {ticket.user_email}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{ticket.message}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(ticket.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-lg ${statusConfig[ticket.status]?.color}`}>
                        {statusConfig[ticket.status]?.label}
                      </span>
                      <button
                        onClick={() => { setSelectedTicket(ticket); setAdminNote(ticket.admin_note || '') }}
                        className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        Yanıtla
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Yanıtla Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-500">{selectedTicket.company_name} · {selectedTicket.user_email}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 mb-4 max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-400">{selectedTicket.message}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1.5 block">Admin Notu (müşteri görebilir)</label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Müşteriye gösterilecek not veya çözüm..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              {[
                { status: 'in_progress', label: 'İşleme Al', color: 'bg-blue-600 hover:bg-blue-700' },
                { status: 'resolved', label: 'Çözüldü', color: 'bg-green-600 hover:bg-green-700' },
                { status: 'closed', label: 'Kapat', color: 'bg-gray-700 hover:bg-gray-600' },
              ].map(action => (
                <button
                  key={action.status}
                  onClick={() => handleUpdate(selectedTicket.id, action.status)}
                  disabled={updating}
                  className={`flex-1 ${action.color} disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-medium transition-colors`}
                >
                  {updating ? '...' : action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}