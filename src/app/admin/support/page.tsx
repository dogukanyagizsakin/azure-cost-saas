'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

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
      
<AdminSidebar />

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