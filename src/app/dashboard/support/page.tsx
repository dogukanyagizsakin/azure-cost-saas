'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const categories = [
  { value: 'technical', label: '🔧 Teknik Sorun', desc: 'Bağlantı, tarama, hata mesajları' },
  { value: 'billing', label: '💳 Fatura & Ödeme', desc: 'Plan, ödeme, fatura soruları' },
  { value: 'feature', label: '💡 Özellik İsteği', desc: 'Yeni özellik veya iyileştirme önerisi' },
  { value: 'azure', label: '☁️ Azure Bağlantısı', desc: 'Azure credentials veya subscription sorunları' },
  { value: 'general', label: '📋 Genel', desc: 'Diğer konular' },
]

const priorities = [
  { value: 'low', label: 'Düşük', color: 'bg-gray-800 text-gray-400 border-gray-700' },
  { value: 'medium', label: 'Orta', color: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' },
  { value: 'high', label: 'Yüksek', color: 'bg-red-900/30 text-red-400 border-red-800/50' },
]

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'tickets'>('new')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)

  const [form, setForm] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    message: '',
  })

  useEffect(() => {
    if (activeTab === 'tickets') loadTickets()
  }, [activeTab])

  async function loadTickets() {
    setLoadingTickets(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/support?accessToken=${session.access_token}`)
    if (res.ok) {
      const data = await res.json()
      setTickets(data.tickets || [])
    }
    setLoadingTickets(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject || !form.message) {
      toast.error('Konu ve mesaj alanları zorunludur')
      return
    }
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session?.access_token, ...form }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        toast.success('Destek talebiniz alındı!')
      } else {
        toast.error(data.error || 'Gönderilemedi')
      }
    } catch {
      toast.error('Hata oluştu')
    }
    setSubmitting(false)
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: 'Açık', color: 'bg-yellow-900/30 text-yellow-400' },
    in_progress: { label: 'İşlemde', color: 'bg-blue-900/30 text-blue-400' },
    resolved: { label: 'Çözüldü', color: 'bg-green-900/30 text-green-400' },
    closed: { label: 'Kapatıldı', color: 'bg-gray-800 text-gray-500' },
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Destek Merkezi</h2>
        <p className="text-sm text-gray-500 mt-1">Size nasıl yardımcı olabiliriz?</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => { setActiveTab('new'); setSubmitted(false) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'new' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Yeni Talep
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tickets' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Taleplerim
        </button>
      </div>

      {/* Yeni Talep */}
      {activeTab === 'new' && (
        <>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-900/20 border border-green-800/50 rounded-2xl p-8 text-center"
            >
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">Talebiniz Alındı!</h3>
              <p className="text-gray-400 text-sm mb-6">Destek ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setSubmitted(false); setForm({ subject: '', category: 'technical', priority: 'medium', message: '' }) }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Yeni Talep Oluştur
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Taleplerime Git
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Kategori */}
              <div>
                <label className="text-xs text-gray-400 mb-3 block">Kategori</label>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        form.category === cat.value
                          ? 'bg-blue-600/20 border-blue-600/50 text-white'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <span className="text-lg">{cat.label.split(' ')[0]}</span>
                      <div>
                        <p className="text-sm font-medium">{cat.label.split(' ').slice(1).join(' ')}</p>
                        <p className="text-xs text-gray-500">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Konu */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Konu</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Sorununuzu kısaca özetleyin..."
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Öncelik */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Öncelik</label>
                <div className="flex gap-2">
                  {priorities.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p.value })}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.priority === p.value ? p.color : 'bg-gray-900 border-gray-800 text-gray-500'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mesaj */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Mesajınız</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Sorununuzu detaylı açıklayın. Hata mesajı, ekran görüntüsü veya adımlar ekleyebilirsiniz..."
                  required
                  rows={6}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* İletişim bilgisi */}
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 flex gap-3">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-300">Yanıt hesabınızın e-posta adresine gönderilecektir. Ortalama yanıt süremiz <strong>24 saat</strong>tir.</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Gönderiliyor...</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Destek Talebi Gönder
                  </>
                )}
              </button>
            </motion.form>
          )}
        </>
      )}

      {/* Taleplerim */}
      {activeTab === 'tickets' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loadingTickets ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-48 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-32" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-white font-medium mb-1">Henüz destek talebiniz yok</p>
              <p className="text-gray-500 text-sm">Sorun yaşadığınızda buradan talep oluşturabilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">{ticket.subject}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ticket.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                          ticket.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ticket.message}</p>
                      {ticket.admin_note && (
                        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mt-2">
                          <p className="text-xs text-blue-300"><strong>Destek Notu:</strong> {ticket.admin_note}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(ticket.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg flex-shrink-0 ${statusConfig[ticket.status]?.color || 'bg-gray-800 text-gray-400'}`}>
                      {statusConfig[ticket.status]?.label || ticket.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}