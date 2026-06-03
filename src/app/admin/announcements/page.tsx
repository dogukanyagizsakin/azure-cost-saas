'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

type Announcement = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  is_active: boolean
  created_at: string
  expires_at: string | null
}

const typeConfig = {
  info: { bg: 'bg-blue-900/30', border: 'border-blue-800/50', text: 'text-blue-400', label: 'Bilgi', icon: 'ℹ️' },
  warning: { bg: 'bg-yellow-900/30', border: 'border-yellow-800/50', text: 'text-yellow-400', label: 'Uyarı', icon: '⚠️' },
  success: { bg: 'bg-green-900/30', border: 'border-green-800/50', text: 'text-green-400', label: 'Başarı', icon: '✅' },
  error: { bg: 'bg-red-900/30', border: 'border-red-800/50', text: 'text-red-400', label: 'Hata', icon: '🚨' },
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info' as Announcement['type'],
    expires_at: '',
  })

  useEffect(() => { loadAnnouncements() }, [])

  async function loadAnnouncements() {
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/announcements', {
      headers: { 'x-admin-token': token || '' },
    })
    if (res.ok) {
      const data = await res.json()
      setAnnouncements(data.announcements)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
        body: JSON.stringify({
          ...form,
          expires_at: form.expires_at || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Duyuru yayınlandı!')
        setShowModal(false)
        setForm({ title: '', message: '', type: 'info', expires_at: '' })
        loadAnnouncements()
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('Hata oluştu') }
    setCreating(false)
  }

  async function handleToggle(id: string, isActive: boolean) {
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
      body: JSON.stringify({ id, is_active: !isActive }),
    })
    if (res.ok) {
      toast.success(isActive ? 'Duyuru gizlendi' : 'Duyuru yayınlandı')
      loadAnnouncements()
    }
  }

  async function handleDelete(id: string) {
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success('Duyuru silindi')
      loadAnnouncements()
    }
  }

  const activeCount = announcements.filter(a => a.is_active).length

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
          {[
            { href: '/admin/dashboard', label: 'Dashboard', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { href: '/admin/customers', label: 'Müşteriler', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
            { href: '/admin/health', label: 'Sistem Sağlığı', color: 'text-green-400', bg: 'bg-green-500/10', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
              <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
          <Link href="/admin/announcements" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Duyurular</span>
            {activeCount > 0 && (
              <span className="ml-auto text-xs bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded-full">{activeCount}</span>
            )}
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
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white">Duyurular</h1>
            {activeCount > 0 && (
              <span className="text-xs bg-pink-900/30 text-pink-400 border border-pink-800/30 px-2 py-0.5 rounded-full">
                {activeCount} aktif duyuru
              </span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Duyuru
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* Önizleme */}
          {activeCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <p className="text-xs text-gray-500 mb-3">📱 Müşterilerin Dashboard'unda Görünüm:</p>
              <div className="space-y-2">
                {announcements.filter(a => a.is_active).slice(0, 2).map(a => {
                  const c = typeConfig[a.type]
                  return (
                    <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${c.bg} ${c.border}`}>
                      <span className="text-base flex-shrink-0">{c.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${c.text}`}>{a.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Duyuru Listesi */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 border border-gray-800 rounded-2xl">
              <span className="text-4xl mb-3">📢</span>
              <p className="text-gray-500 text-sm mb-4">Henüz duyuru yok</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                İlk Duyuruyu Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a, i) => {
                const c = typeConfig[a.type]
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-gray-900 border rounded-xl p-5 transition-all ${
                      a.is_active ? 'border-gray-700' : 'border-gray-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-xl flex-shrink-0 mt-0.5">{c.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-semibold text-white">{a.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}`}>
                              {c.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              a.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
                            }`}>
                              {a.is_active ? '● Yayında' : '○ Gizli'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{a.message}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>{new Date(a.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {a.expires_at && (
                              <span>· Bitiş: {new Date(a.expires_at).toLocaleDateString('tr-TR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(a.id, a.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                            a.is_active
                              ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30 hover:bg-yellow-900/40'
                              : 'bg-green-900/20 text-green-400 border-green-800/30 hover:bg-green-900/40'
                          }`}
                        >
                          {a.is_active ? 'Gizle' : 'Yayınla'}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-xs bg-red-900/20 text-red-400 border border-red-800/30 px-2.5 py-1 rounded-lg hover:bg-red-900/40 transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Yeni Duyuru Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Yeni Duyuru</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tüm müşterilerin dashboard'unda görünecek</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Duyuru Tipi</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(typeConfig) as [Announcement['type'], typeof typeConfig[keyof typeof typeConfig]][]).map(([key, c]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, type: key })}
                        className={`py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1 ${
                          form.type === key
                            ? `${c.bg} ${c.text} ${c.border}`
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Başlık</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Örn: Sistem Bakımı"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Mesaj</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Müşterilere gösterilecek mesaj..."
                    required
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Bitiş Tarihi (opsiyonel)</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={e => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">Boş bırakırsanız manuel kapatana kadar gösterilir</p>
                </div>

                {/* Önizleme */}
                {form.title && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Önizleme:</p>
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${typeConfig[form.type].bg} ${typeConfig[form.type].border}`}>
                      <span className="text-base">{typeConfig[form.type].icon}</span>
                      <div>
                        <p className={`text-sm font-semibold ${typeConfig[form.type].text}`}>{form.title}</p>
                        {form.message && <p className="text-xs text-gray-400 mt-0.5">{form.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors">
                    İptal
                  </button>
                  <button type="submit" disabled={creating} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    {creating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Yayınlanıyor...</> : '📢 Yayınla'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}