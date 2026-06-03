'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

function BudgetTab() {
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [alertThreshold, setAlertThreshold] = useState('80')
  const [saving, setSaving] = useState(false)
  const [currentSpend] = useState(9600)

  useEffect(() => {
    fetch('/api/budget')
      .then(r => r.json())
      .then(d => {
        if (d.monthlyBudget) setMonthlyBudget(d.monthlyBudget.toString())
        if (d.alertThreshold) setAlertThreshold(d.alertThreshold.toString())
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
        alertThreshold: parseInt(alertThreshold),
      }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Bütçe ayarları kaydedildi!')
    } else {
      toast.error('Hata: ' + data.error)
    }
    setSaving(false)
  }

  const budgetNum = parseFloat(monthlyBudget) || 0
  const percentage = budgetNum > 0 ? Math.round((currentSpend / budgetNum) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        <h3 className="text-sm font-semibold text-white">Aylık Bütçe Limiti</h3>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Aylık Bütçe ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={monthlyBudget}
              onChange={e => setMonthlyBudget(e.target.value)}
              placeholder="10000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Aylık Azure harcama limitinizi belirleyin</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Uyarı Eşiği — %{alertThreshold}</label>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={alertThreshold}
            onChange={e => setAlertThreshold(e.target.value)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>%50</span>
            <span>Bütçenin %{alertThreshold}&apos;ine ulaşınca uyar</span>
            <span>%95</span>
          </div>
        </div>
        {budgetNum > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3">Mevcut Durum Önizlemesi</p>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Mevcut harcama</span>
              <span className="text-white font-medium">${currentSpend.toLocaleString()} / ${budgetNum.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage >= 100 ? 'bg-red-500' :
                  percentage >= parseInt(alertThreshold) ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-500">%{percentage} kullanıldı</span>
              <span className={`text-xs font-medium ${
                percentage >= 100 ? 'text-red-400' :
                percentage >= parseInt(alertThreshold) ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {percentage >= 100 ? '⚠ Bütçe aşıldı!' :
                 percentage >= parseInt(alertThreshold) ? '⚠ Uyarı eşiğine ulaşıldı' : '✓ Bütçe dahilinde'}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Kaydet
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Bütçe Uyarıları</h3>
        <div className="space-y-3">
          {[
            { label: 'Eşik aşıldığında e-posta gönder', desc: 'Bütçenin belirlenen yüzdesine ulaşınca bildir', active: true },
            { label: 'Bütçe aşıldığında acil uyarı', desc: 'Limit aşıldığında anında bildir', active: true },
            { label: 'Günlük harcama özeti', desc: 'Her gün mevcut harcamayı raporla', active: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <div className={`relative w-10 h-5 rounded-full ${item.active ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${item.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TeamTab() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [sending, setSending] = useState(false)
  const [invitations, setInvitations] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!userData) return

    const { data: membersData } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', userData.tenant_id)

    setMembers(membersData || [])

    const invRes = await fetch('/api/invite')
    const invData = await invRes.json()
    setInvitations(invData.invitations || [])
  }

  async function handleInvite() {
    if (!email) { toast.error('E-posta adresi girin'); return }
    setSending(true)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Davet e-postası gönderildi!')
      setEmail('')
      loadData()
    } else {
      toast.error(data.error)
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Takım Üyeleri</h3>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{m.email?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm text-white">{m.full_name || m.email}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                m.role === 'owner' ? 'bg-purple-900/50 text-purple-400' :
                m.role === 'admin' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-400'
              }`}>
                {m.role === 'owner' ? 'Sahip' : m.role === 'admin' ? 'Admin' : 'Görüntüleyici'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Yeni Üye Davet Et</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ornek@sirket.com"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="admin">Admin</option>
            <option value="viewer">Görüntüleyici</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {sending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Davet Gönder
          </button>
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Bekleyen Davetler</h3>
          <div className="space-y-2">
            {invitations.map((inv, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white">{inv.email}</p>
                  <p className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleDateString('tr-TR')} tarihinde gönderildi</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  inv.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                  inv.status === 'accepted' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {inv.status === 'pending' ? 'Bekliyor' : inv.status === 'accepted' ? 'Kabul Edildi' : 'Süresi Doldu'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'azure' | 'notifications' | 'budget' | 'team' | 'account'>('azure')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error' | 'testing'>('unknown')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [subscriptionName, setSubscriptionName] = useState('')
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [newSubId, setNewSubId] = useState('')
  const [newSubName, setNewSubName] = useState('')
  const [addingSubscription, setAddingSubscription] = useState(false)

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
    loadSettings()
  }, [])

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

    // Subscriptionları yükle
    const subRes = await fetch(`/api/azure/subscriptions?accessToken=${session.access_token}`)
    if (subRes.ok) {
      const subData = await subRes.json()
      setSubscriptions(subData.subscriptions || [])
    }
  }

  async function handleAzureSave() {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/azure/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...azureForm, accessToken: session?.access_token }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Azure bilgileri kaydedildi!')
      } else {
        toast.error('Hata: ' + data.error)
      }
    } catch {
      toast.error('Kaydetme sırasında hata oluştu')
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
        toast.success(`Bağlantı başarılı! Subscription: ${data.subscriptionName}`)
      } else {
        setConnectionStatus('error')
        setConnectionMessage(data.error || 'Bağlantı başarısız')
        toast.error(data.error || 'Bağlantı başarısız')
      }
    } catch {
      setConnectionStatus('error')
      setConnectionMessage('Bağlantı testi başarısız')
      toast.error('Bağlantı testi başarısız')
    }
    setTesting(false)
  }

  async function handleNotifSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Bildirim ayarları kaydedildi!')
  }

  async function handleTestEmail() {
    if (!notifForm.email) { toast.error('Önce e-posta adresinizi girin'); return }
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
      if (data.success) {
        toast.success('Test e-postası gönderildi!')
      } else {
        toast.error('Hata: ' + data.error)
      }
    } catch {
      toast.error('E-posta gönderilemedi')
    }
    setSendingTest(false)
  }

  async function handleAddSubscription() {
    if (!newSubId) return
    setAddingSubscription(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/azure/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session?.access_token,
          subscriptionId: newSubId.trim(),
          subscriptionName: newSubName.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Subscription eklendi!')
        setNewSubId('')
        setNewSubName('')
        loadSettings()
      } else {
        toast.error(data.error || 'Eklenemedi')
      }
    } catch { toast.error('Hata oluştu') }
    setAddingSubscription(false)
  }

  async function handleDeleteSubscription(subDbId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/azure/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, subscriptionDbId: subDbId }),
    })
    if (res.ok) {
      toast.success('Subscription silindi')
      loadSettings()
    } else {
      toast.error('Silinemedi')
    }
  }

  async function handleToggleSubscription(subDbId: string, isActive: boolean) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/azure/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, subscriptionDbId: subDbId, isActive: !isActive }),
    })
    if (res.ok) {
      toast.success(isActive ? 'Pasif edildi' : 'Aktif edildi')
      loadSettings()
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Ayarlar</h2>
        <p className="text-sm text-gray-500 mt-1">Azure bağlantısı ve bildirim tercihlerinizi yönetin</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit flex-wrap">
        {[
          { key: 'azure', label: 'Azure Bağlantısı' },
          { key: 'notifications', label: 'Bildirimler' },
          { key: 'budget', label: 'Bütçe' },
          { key: 'team', label: 'Takım' },
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

          {/* Credentials */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white mb-4">Azure Service Principal Bilgileri</h3>
            {[
              { label: 'Tenant ID (Directory ID)', key: 'tenantId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
              { label: 'Client ID (Application ID)', key: 'clientId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
              { label: 'Client Secret', key: 'clientSecret', placeholder: '••••••••••••••••••••••••••••••••', type: 'password' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs text-gray-400 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={azureForm[field.key as keyof typeof azureForm]}
                  onChange={e => setAzureForm({ ...azureForm, [field.key]: e.target.value })}
                  onFocus={() => {
                    if (field.key === 'clientSecret' && azureForm.clientSecret === '••••••••••••••••') {
                      setAzureForm({ ...azureForm, clientSecret: '' })
                    }
                  }}
                  placeholder={field.placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}
            <p className="text-xs text-gray-600">Client Secret şifrelenmiş olarak saklanır</p>
            <button
              onClick={handleAzureSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor...</> : 'Credentials Kaydet'}
            </button>
          </div>

          {/* Subscription Yönetimi */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Azure Subscriptions</h3>
                <p className="text-xs text-gray-500 mt-0.5">Birden fazla subscription ekleyebilirsiniz</p>
              </div>
              <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800/30 px-2 py-0.5 rounded-full">
                {subscriptions.length} subscription
              </span>
            </div>

            {/* Mevcut Subscriptionlar */}
            <div className="space-y-2 mb-6">
              {subscriptions.length === 0 ? (
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">Henüz subscription eklenmemiş</p>
                </div>
              ) : (
                subscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.is_active ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <div>
                        <p className="text-sm text-white font-medium">{sub.subscription_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{sub.subscription_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleSubscription(sub.id, sub.is_active)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                          sub.is_active
                            ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30 hover:bg-yellow-900/40'
                            : 'bg-green-900/20 text-green-400 border-green-800/30 hover:bg-green-900/40'
                        }`}
                      >
                        {sub.is_active ? 'Pasif Et' : 'Aktif Et'}
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(sub.id)}
                        className="text-xs bg-red-900/20 text-red-400 border border-red-800/30 px-2 py-1 rounded-lg hover:bg-red-900/40 transition-colors"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Yeni Subscription Ekle */}
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
              <h5 className="text-xs font-semibold text-gray-400 mb-3">Yeni Subscription Ekle</h5>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subscription ID</label>
                  <input
                    type="text"
                    value={newSubId}
                    onChange={e => setNewSubId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">İsim (opsiyonel)</label>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value)}
                    placeholder="Örn: Production, Development..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddSubscription}
                  disabled={addingSubscription || !newSubId}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {addingSubscription ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Doğrulanıyor...</>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Subscription Ekle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bağlantı Durumu */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Bağlantı Durumu</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'success' ? 'bg-green-500' :
                connectionStatus === 'error' ? 'bg-red-500' :
                connectionStatus === 'testing' ? 'bg-blue-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              <span className={`text-sm ${
                connectionStatus === 'success' ? 'text-green-400' :
                connectionStatus === 'error' ? 'text-red-400' :
                connectionStatus === 'testing' ? 'text-blue-400' : 'text-yellow-400'
              }`}>
                {connectionStatus === 'unknown' ? 'Henüz test edilmedi' : connectionMessage}
              </span>
            </div>
            {subscriptionName && connectionStatus === 'success' && (
              <p className="text-xs text-gray-500 mb-3">Subscription: <span className="text-gray-300">{subscriptionName}</span></p>
            )}
            <button
              onClick={handleTestConnection}
              disabled={testing || !azureForm.clientId}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {testing && <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
              Bağlantıyı Test Et
            </button>
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
              onChange={e => setNotifForm({ ...notifForm, email: e.target.value })}
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
                  onClick={() => setNotifForm({ ...notifForm, [item.key]: !notifForm[item.key as keyof typeof notifForm] })}
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
              onChange={e => setNotifForm({ ...notifForm, costThreshold: e.target.value })}
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
              {saving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor...</> : 'Kaydet'}
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

      {/* Bütçe */}
      {activeTab === 'budget' && <BudgetTab />}

      {/* Takım */}
      {activeTab === 'team' && <TeamTab />}

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
              Pro&apos;ya Yükselt
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