'use client'

import { motion } from 'framer-motion'

const proFeatures = [
  { icon: '☁️', title: 'Sınırsız Azure Kaynağı', desc: 'Tüm kaynaklarınızı sınırsız tarayın ve yönetin' },
  { icon: '🔄', title: 'Otomatik Tarama', desc: 'Kaynaklarınız 8 saatte bir otomatik taranır' },
  { icon: '💡', title: 'Akıllı Öneriler', desc: 'AI destekli optimizasyon önerileri alın' },
  { icon: '📊', title: 'Detaylı Raporlar', desc: 'PDF, Excel ve PowerPoint formatında raporlar' },
  { icon: '🤖', title: 'AI Asistan', desc: 'Azure maliyetleriniz hakkında anlık sorular sorun' },
  { icon: '📈', title: 'FinOps Skoru', desc: 'Maliyet optimizasyon skorunuzu takip edin' },
  { icon: '💰', title: 'Tasarruf Planı', desc: 'Kişiselleştirilmiş tasarruf planları oluşturun' },
  { icon: '🔔', title: 'Bütçe Alarmları', desc: 'Bütçe aşımlarında anında bildirim alın' },
  { icon: '👥', title: 'Takım Yönetimi', desc: 'Ekibinizle birlikte çalışın' },
]

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-800/50 text-blue-400 text-xs font-medium px-4 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Pro Plan
          </div>
          <h1 className="text-4xl font-black text-white mb-4">
            Tüm özelliklere
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> sınırsız erişin</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Azure maliyetlerinizi optimize etmek için ihtiyacınız olan her şey tek platformda.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Free Plan</h3>
                <p className="text-gray-500 text-sm">7 günlük deneme</p>
              </div>
              <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">Mevcut Plan</span>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Azure kaynakları', value: 'Sınırlı', ok: true },
                { label: 'Tarama sıklığı', value: 'Manuel', ok: true },
                { label: 'Öneriler', value: 'Temel', ok: true },
                { label: 'Raporlar', value: '—', ok: false },
                { label: 'AI Asistan', value: '—', ok: false },
                { label: 'FinOps Skoru', value: '—', ok: false },
                { label: 'Tasarruf Planı', value: '—', ok: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className={`text-sm ${item.ok ? 'text-gray-400' : 'text-gray-600 line-through'}`}>{item.label}</span>
                  <span className={`text-xs font-medium ${item.ok ? 'text-gray-300' : 'text-gray-600'}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="text-center text-gray-600 text-sm py-3 border border-gray-800 rounded-xl">7 günlük deneme</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Pro Plan</h3>
                <p className="text-blue-400 text-sm">Sınırsız erişim</p>
              </div>
              <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">Önerilen</span>
            </div>
            <div className="relative space-y-3 mb-6">
              {[
                { label: 'Azure kaynakları', value: 'Sınırsız' },
                { label: 'Tarama sıklığı', value: 'Otomatik 8s' },
                { label: 'Öneriler', value: 'AI Destekli' },
                { label: 'Raporlar', value: 'PDF/Excel/PPT' },
                { label: 'AI Asistan', value: 'Sınırsız' },
                { label: 'FinOps Skoru', value: 'Dahil' },
                { label: 'Tasarruf Planı', value: 'Dahil' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <span className="text-xs font-medium text-blue-400 flex items-center gap-1">
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => { window.location.href = 'mailto:info@unifytech.com.tr?subject=Pro Plan Talebi' }} className="relative w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Pro Plana Geç — Bize Ulaşın
            </button>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold text-white text-center mb-8">Pro Plan ile neler yapabilirsiniz?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proFeatures.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <span className="text-2xl mb-3 block">{feature.icon}</span>
                <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center mt-12">
          <p className="text-gray-500 text-sm mb-4">Pro plana geçmek için bizimle iletişime geçin</p>
          <button onClick={() => { window.location.href = 'mailto:info@unifytech.com.tr?subject=Pro Plan Talebi' }} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            info@unifytech.com.tr
          </button>
        </motion.div>
      </div>
    </div>
  )
}