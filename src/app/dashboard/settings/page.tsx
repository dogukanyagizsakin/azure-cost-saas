'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'azure' | 'notifications' | 'account'>('azure')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error' | 'testing'>('unknown')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [subscriptionName, setSubscriptionName] = useState('')

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

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setNotifForm(prev => ({ ...prev, email: session.user.email || '' }))

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single()

      if (!userData) return

      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single()

      if (tenant) {
        setAzureForm({
          subscriptionId: tenant.azure_subscription_id || '',
          tenantId: tenant.azure_tenant_id || '',
          clientId: tenant.azure_client_id || '',
          clientSecret: tenant.azure_client_secret ? '••••••••••••••••' : '',
        })
        if (tenant.azure_subscription_id) {
          setConnectionStatus('success')
          setConnectionMessage('Azure bağlantısı mevcut')
        }
      }
    }
    loadSettings()
  }, [])

  async function handleAzureSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/azure/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureForm),
      })
      const data = await response.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert('Hata: ' + data.error)
      }
    } catch {
      alert('Kaydetme hatası')
    }
    setSaving(false)
  }

  async function handleTestConnection() {
    setTesting(true)
    setConnectionStatus('testing')
    setConnectionMessage('Test ediliyor...')
    try {
      const response = await fetch('/api/azure/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureForm),
      })
      const data = await response.json()
      if (data.success) {
        setConnectionStatus('success')
        setSubscriptionName(data.subscriptionName)
        setConnectionMessage(`Bağlantı başarılı! Subscription: ${data.subscriptionName}`)
      } else {
        setConnectionStatus('error')
        setConnectionMessage(data.error || 'Bağlantı başarısız')
      }
    } catch {
      setConnectionStatus('error')
      setConnectionMessage('Bağlantı testi başarısız')
    }
    setTesting(false)
  }

  async function handleNotifSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleTestEmail() {
    if (!notifForm.email) {
      alert('Önce e-posta adresinizi girin')
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: notifForm.email,
          companyName: 'UnifyTech',
          resourcesScanned: 47,
          recommendationsFound: 5,
          totalCost: 9600,
          estimatedSaving: 1970,
          recommendations: [
            { kaynak: 'prod-vm-01', tip: 'Boşta VM', tasarruf: 820, oncelik: 'yüksek' },
            { kaynak: 'dev-vm-02', tip: 'Boşta VM', tasarruf: 340, oncelik: 'yüksek' },
            { kaynak: 'storage-backup', tip: 'Orphan Kaynak', tasarruf: 410, oncelik: 'orta' },
          ],
        }),
      })
      const data = await res.json()
      alert(data.success ? '✅ Test e-postası gönderildi! Gelen kutunuzu kontrol edin.' : '❌ Hata: ' + data.error)
    } catch {
      alert('❌ E-posta gönderilemedi')
    }
    setSendingTest(false)
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
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
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

            {[
              { label: 'Subscription ID', key: 'subscriptionId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
              { label: 'Tenant ID (Directory ID)', key: 'tenantId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
              { label: 'Client ID (Application ID)', key: 'clientId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
              { label: 'Client Secret', key: 'clientSecret', placeholder: '••••••••••••••••••••••••••••••••', type: 'password' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs text-gray-400 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={azureForm[field.key as keyof typeof azureForm]}
                  onChange={e => setAzureForm({...azureForm, [field.key]: e.target.value})}
                  onFocus={() => {
                    if (field.key === 'clientSecret' && azureForm.clientSecret === '••••••••••••••••') {
                      setAzureForm({...azureForm, clientSecret: ''})
                    }
                  }}
                  placeholder={field.placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}
            <p className="text-xs text-gray-600">Client Secret şifrelenmiş olarak saklanır</p>

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
              <button
                onClick={handleTestConnection}
                disabled={testing || !azureForm.subscriptionId}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {testing && <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                Bağlantıyı Test Et
              </button>
            </div>
          </div>

          {/* Bağlantı Durumu */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Bağlantı Durumu</h3>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'success' ? 'bg-green-500' :
                connectionStatus === 'error' ? 'bg-red-500' :
                connectionStatus === 'testing' ? 'bg-blue-500 animate-pulse' :
                'bg-yellow-500'
              }`} />
              <span className={`text-sm ${
                connectionStatus === 'success' ? 'text-green-400' :
                connectionStatus === 'error' ? 'text-red-400' :
                connectionStatus === 'testing' ? 'text-blue-400' :
                'text-yellow-400'
              }`}>
                {connectionStatus === 'unknown' ? 'Henüz test edilmedi' : connectionMessage}
              </span>
            </div>
            {subscriptionName && connectionStatus === 'success' && (
              <p className="text-xs text-gray-500 mt-2">Subscription: <span className="text-gray-300">{subscriptionName}</span></p>
            )}
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

          <div className="flex items-center gap-3">
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

            <button
              onClick={handleTestEmail}
              disabled={sendingTest || !notifForm.email}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {sendingTest ? (
                <><div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Gönderiliyor...</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Test E-postası Gönder
                </>
              )}
            </button>
          </div>
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