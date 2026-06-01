'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const steps = [
  { id: 1, title: 'Hoş Geldiniz', desc: 'Platforma genel bakış' },
  { id: 2, title: 'Azure Bağlantısı', desc: 'Service Principal kurulumu' },
  { id: 3, title: 'Bildirimler', desc: 'E-posta ayarları' },
  { id: 4, title: 'Hazır!', desc: 'İlk taramayı başlatın' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionOk, setConnectionOk] = useState(false)

  const [azureForm, setAzureForm] = useState({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
  })

  const [notifEmail, setNotifEmail] = useState('')

async function handleTestConnection() {
  setTesting(true)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/azure/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...azureForm,
        accessToken: session?.access_token,
      }),
    })
    const data = await response.json()
    if (data.success) {
      setConnectionOk(true)
      toast.success(`Bağlantı başarılı! Subscription: ${data.subscriptionName}`)
    } else {
      toast.error(data.error || 'Bağlantı başarısız')
    }
  } catch {
    toast.error('Bağlantı testi başarısız')
  }
  setTesting(false)
}

async function handleSaveAzure() {
  setSaving(true)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/azure/save-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...azureForm,
        accessToken: session?.access_token,
      }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success('Azure bilgileri kaydedildi!')
      setCurrentStep(3)
    } else {
      toast.error(data.error)
    }
  } catch {
    toast.error('Kaydetme hatası')
  }
  setSaving(false)
}

  async function handleFinish() {
    setSaving(true)
    try {
      // İlk taramayı başlat
      const response = await fetch('/api/scan', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        toast.success(`Tarama tamamlandı! ${data.resourcesScanned} kaynak bulundu.`)
      }
    } catch {
      // Tarama hatası olsa bile dashboard'a git
    }
    router.push('/dashboard')
  }

  async function skipOnboarding() {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Sol Panel */}
      <div className="hidden lg:flex w-80 bg-gray-900 border-r border-gray-800 flex-col p-8">
        <div className="mb-12">
          <span className="text-white font-bold text-xl tracking-tight">Unify</span>
          <span className="text-blue-400 font-light text-xl tracking-tight">Tech</span>
          <p className="text-gray-600 text-xs mt-1">Azure Cost Management</p>
        </div>

        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                currentStep === step.id ? 'bg-blue-600/10 border border-blue-600/20' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                currentStep > step.id ? 'bg-green-600 text-white' :
                currentStep === step.id ? 'bg-blue-600 text-white' :
                'bg-gray-800 text-gray-500'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <div>
                <p className={`text-sm font-medium ${currentStep === step.id ? 'text-white' : 'text-gray-500'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-600">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-[47px] mt-10 w-0.5 h-6 bg-gray-800" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <button
            onClick={skipOnboarding}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Kurulumu atla →
          </button>
        </div>
      </div>

      {/* Sağ Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">

          {/* Adım 1 — Hoş Geldiniz */}
          {currentStep === 1 && (
            <div>
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-8 text-3xl">
                👋
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Hoş Geldiniz!</h1>
              <p className="text-gray-400 mb-8 leading-relaxed">
                UnifyTech Azure Cost Management platformuna hoş geldiniz. Bu kısa kurulum sihirbazı ile Azure subscription'ınızı bağlayıp maliyet optimizasyonuna hemen başlayabilirsiniz.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: '🔍', title: '8 saatlik otomatik tarama', desc: 'Azure kaynaklarınız düzenli olarak taranır' },
                  { icon: '💡', title: 'Akıllı optimizasyon önerileri', desc: 'Boşta kalan kaynakları tespit eder' },
                  { icon: '📧', title: 'E-posta bildirimleri', desc: 'Tarama sonuçları anında e-postanıza gelir' },
                  { icon: '💰', title: 'Ortalama %40 tasarruf', desc: 'Gereksiz harcamaları ortadan kaldırın' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Başlayalım →
              </button>
            </div>
          )}

          {/* Adım 2 — Azure Bağlantısı */}
          {currentStep === 2 && (
            <div>
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-8 text-3xl">
                ☁️
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Azure&apos;u Bağlayın</h1>
              <p className="text-gray-400 mb-6 text-sm">Service Principal bilgilerinizi girin.</p>

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-6">
                <p className="text-xs text-blue-300 font-medium mb-1">Nasıl oluşturulur?</p>
                <p className="text-xs text-blue-400/70">
                  Azure Portal → App registrations → New registration → Subscriptions → IAM → Reader rolü
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  { label: 'Subscription ID', key: 'subscriptionId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
                  { label: 'Tenant ID', key: 'tenantId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
                  { label: 'Client ID', key: 'clientId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
                  { label: 'Client Secret', key: 'clientSecret', placeholder: '••••••••••••••••' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-400 mb-1.5">{field.label}</label>
                    <input
                      type={field.key === 'clientSecret' ? 'password' : 'text'}
                      value={azureForm[field.key as keyof typeof azureForm]}
                      onChange={e => setAzureForm({...azureForm, [field.key]: e.target.value})}
                      placeholder={field.placeholder}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !azureForm.subscriptionId}
                  className="flex-1 border border-gray-700 hover:border-gray-500 disabled:opacity-50 text-gray-300 text-sm font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {testing && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                  {connectionOk ? '✓ Bağlantı Başarılı' : 'Bağlantıyı Test Et'}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 border border-gray-800 text-gray-400 text-sm py-3 rounded-xl hover:border-gray-700 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={handleSaveAzure}
                  disabled={saving || !azureForm.subscriptionId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Kaydet ve Devam Et →
                </button>
              </div>

              <button
                onClick={() => setCurrentStep(3)}
                className="w-full mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Şimdilik atla
              </button>
            </div>
          )}

          {/* Adım 3 — Bildirimler */}
          {currentStep === 3 && (
            <div>
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-8 text-3xl">
                📧
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">E-posta Bildirimleri</h1>
              <p className="text-gray-400 mb-6 text-sm">Tarama sonuçları bu adrese gönderilecek.</p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Bildirim E-postası</label>
                  <input
                    type="email"
                    value={notifEmail}
                    onChange={e => setNotifEmail(e.target.value)}
                    placeholder="admin@sirketiniz.com"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Tarama Raporu', desc: 'Her tarama sonrası özet e-posta' },
                    { label: 'Maliyet Alarmı', desc: 'Bütçe eşiği aşıldığında uyarı' },
                    { label: 'Haftalık Özet', desc: 'Her Pazartesi haftalık rapor' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl">
                      <div>
                        <p className="text-sm text-white">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 border border-gray-800 text-gray-400 text-sm py-3 rounded-xl hover:border-gray-700 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  Devam Et →
                </button>
              </div>

              <button
                onClick={() => setCurrentStep(4)}
                className="w-full mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Şimdilik atla
              </button>
            </div>
          )}

          {/* Adım 4 — Hazır */}
          {currentStep === 4 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600/20 rounded-2xl flex items-center justify-center mb-8 text-4xl mx-auto">
                🎉
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Her Şey Hazır!</h1>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Kurulum tamamlandı. Şimdi ilk taramayı başlatabilirsiniz. Azure kaynaklarınız analiz edilecek ve optimizasyon önerileri hazırlanacak.
              </p>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-left space-y-3">
                <p className="text-sm font-medium text-white mb-4">Kurulum Özeti</p>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${azureForm.subscriptionId ? 'bg-green-600' : 'bg-gray-700'}`}>
                    {azureForm.subscriptionId ? '✓' : '○'}
                  </div>
                  <span className="text-sm text-gray-400">Azure bağlantısı</span>
                  {azureForm.subscriptionId && <span className="text-xs text-green-400 ml-auto">Tamamlandı</span>}
                  {!azureForm.subscriptionId && <span className="text-xs text-gray-600 ml-auto">Atlandı</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${notifEmail ? 'bg-green-600' : 'bg-gray-700'}`}>
                    {notifEmail ? '✓' : '○'}
                  </div>
                  <span className="text-sm text-gray-400">E-posta bildirimleri</span>
                  {notifEmail && <span className="text-xs text-green-400 ml-auto">Tamamlandı</span>}
                  {!notifEmail && <span className="text-xs text-gray-600 ml-auto">Atlandı</span>}
                </div>
              </div>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Tarama başlatılıyor...</>
                ) : (
                  <>🚀 İlk Taramayı Başlat</>
                )}
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full border border-gray-800 text-gray-400 text-sm py-3 rounded-xl hover:border-gray-700 transition-colors"
              >
                Taramayı daha sonra yap
              </button>
            </div>
          )}

          {/* Adım göstergesi — mobil */}
          <div className="flex justify-center gap-2 mt-8 lg:hidden">
            {steps.map(step => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentStep === step.id ? 'bg-blue-500' :
                  currentStep > step.id ? 'bg-green-500' :
                  'bg-gray-700'
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}