'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'azure' | 'notifications' | 'account'>('azure')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [azureForm, setAzureForm] = useState({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
  })

  const [notifForm, setNotifForm] = useState({
    email: '',
    scanReport: true,
    costAlert: true,
    costThreshold: '500',
    weeklyReport: true,
  })

  async function handleAzureSave() {
    setSaving(true)
    // Gerçek kaydetme işlemi ilerleyen adımlarda eklenecek
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleNotifSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Ayarlar</h2>
        <p className="text-sm text-gray-500 mt-1">Azure bağlantısı ve bildirim tercihlerinizi yönetin</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'azure', label: 'Azure Bağlantısı' },
          { key: 'notifications', label: 'Bildirimler' },
          { key: 'account', label: 'Hesap' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Azure Bağlantısı */}
      {activeTab === 'azure' && (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-300 font-medium">Service Principal Nasıl Oluşturulur?</p>
                <p className="text-xs text-blue-400/70 mt-1">Azure Portal → Azure Active Directory → App registrations → New registration. Ardından Subscriptions → Access control (IAM) → Add role assignment → Reader rolü verin.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white mb-4">Azure Service Principal Bilgileri</h3>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Subscription ID</label>
              <input
                type="text"
                value={azureForm.subscriptionId}
                onChange={e => setAzureForm({...azureForm, subscriptionId: e.target.value})}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tenant ID (Directory ID)</label>
              <input
                type="text"
                value={azureForm.tenantId}
                onChange={e => setAzureForm({...azureForm, tenantId: e.target.value})}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Client ID (Application ID)</label>
              <input
                type="text"
                value={azureForm.clientId}
                onChange={e => setAzureForm({...azureForm, clientId: e.target.value})}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Client Secret</label>
              <input
                type="password"
                value={azureForm.clientSecret}
                onChange={e => setAzureForm({...azureForm, clientSecret: e.target.value})}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1">Değer şifrelenmiş olarak saklanır</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAzureSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor...</>
                ) : saved ? (
                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Kaydedildi!</>
                ) : 'Kaydet'}
              </button>
              <button className="text-sm text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-lg transition-colors">
                Bağlantıyı Test Et
              </button>
            </div>
          </div>

          {/* Bağlantı Durumu */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Bağlantı Durumu</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-yellow-400">Henüz bağlanmadı</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Azure bilgilerini girerek kaydedin, ardından bağlantıyı test edin.</p>
          </div>
        </div>
      )}

      {/* Bildirimler */}
      {activeTab === 'notifications' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white">E-posta Bildirimleri</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Bildirim E-postası</label>
            <input
              type="email"
              value={notifForm.email}
              onChange={e => setNotifForm({...notifForm, email: e.target.value})}
              placeholder="admin@sirketiniz.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Bildirim Tercihleri</p>

            {[
              { key: 'scanReport', label: 'Tarama Raporu', desc: 'Her tarama sonrası özet e-posta gönder' },
              { key: 'costAlert', label: 'Maliyet Alarmı', desc: 'Maliyet eşiği aşıldığında uyar' },
              { key: 'weeklyReport', label: 'Haftalık Rapor', desc: 'Her Pazartesi haftalık özet gönder' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifForm({...notifForm, [item.key]: !notifForm[item.key as keyof typeof notifForm]})}
                  className={`relative w-10 h-5 rounded-full transition-colors ${notifForm[item.key as keyof typeof notifForm] ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${notifForm[item.key as keyof typeof notifForm] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Maliyet Alarm Eşiği ($)</label>
            <input
              type="number"
              value={notifForm.costThreshold}
              onChange={e => setNotifForm({...notifForm, costThreshold: e.target.value})}
              className="w-48 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-600 mt-1">Günlük maliyet bu değeri aşarsa alarm gönderilir</p>
          </div>

          <button
            onClick={handleNotifSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor...</>
            ) : saved ? (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Kaydedildi!</>
            ) : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Hesap */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Hesap Bilgileri</h3>
            <div className="space-y-3">
              {[
                { label: 'Plan', value: 'Free', badge: true },
                { label: 'Tarama Sıklığı', value: '8 saatte bir' },
                { label: 'Maks. Kaynak', value: '100 kaynak' },
                { label: 'Veri Saklama', value: '30 gün' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  {item.badge ? (
                    <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">{item.value}</span>
                  ) : (
                    <span className="text-sm text-white">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-2">Pro Plana Geç</h3>
            <p className="text-xs text-gray-500 mb-4">Sınırsız kaynak, 1 saatlik tarama ve 90 günlük veri saklama</p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Pro'ya Yükselt — $49/ay
            </button>
          </div>

          <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-red-400 mb-2">Tehlikeli Bölge</h3>
            <p className="text-xs text-gray-500 mb-4">Hesabınızı ve tüm verilerinizi kalıcı olarak silersiniz.</p>
            <button className="text-red-400 hover:text-red-300 text-sm border border-red-900/50 hover:border-red-700 px-4 py-2 rounded-lg transition-colors">
              Hesabı Sil
            </button>
          </div>
        </div>
      )}
    </div>
  )
}