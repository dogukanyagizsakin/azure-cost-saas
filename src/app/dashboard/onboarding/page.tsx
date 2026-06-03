'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const steps = [
  { id: 1, title: 'Hoş Geldiniz', icon: '👋' },
  { id: 2, title: 'Azure Hazırlık', icon: '☁️' },
  { id: 3, title: 'Bağlantı Bilgileri', icon: '🔑' },
  { id: 4, title: 'Subscription Ekle', icon: '➕' },
  { id: 5, title: 'İlk Tarama', icon: '🎉' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanDone, setScanDone] = useState(false)
  const [credentials, setCredentials] = useState({
    tenantId: '',
    clientId: '',
    clientSecret: '',
  })
  const [credentialsSaved, setCredentialsSaved] = useState(false)
  const [subscription, setSubscription] = useState({ id: '', name: '' })
  const [subscriptionAdded, setSubscriptionAdded] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    checkOnboarding()
  }, [])

  async function checkOnboarding() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`/api/onboarding?accessToken=${session.access_token}`)
    if (res.ok) {
      const data = await res.json()
      if (data.onboardingCompleted) {
        router.push('/dashboard')
        return
      }
      setCurrentStep(data.currentStep || 1)
      if (data.hasCredentials) setCredentialsSaved(true)
      if (data.hasSubscription) setSubscriptionAdded(true)
    }
  }

  async function handleSaveCredentials() {
    if (!credentials.tenantId || !credentials.clientId || !credentials.clientSecret) {
      toast.error('Tüm alanları doldurun')
      return
    }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/azure/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: credentials.tenantId,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          subscriptionId: '',
          accessToken: session?.access_token,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCredentialsSaved(true)
        toast.success('Credentials kaydedildi!')
        setCurrentStep(4)
      } else {
        toast.error(data.error || 'Kaydedilemedi')
      }
    } catch {
      toast.error('Hata oluştu')
    }
    setLoading(false)
  }

  async function handleTestConnection() {
    setTesting(true)
    setTestResult('idle')
    try {
      const res = await fetch('/api/azure/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const data = await res.json()
      if (data.success) {
        setTestResult('success')
        toast.success(`Bağlantı başarılı! ${data.subscriptionName}`)
      } else {
        setTestResult('error')
        toast.error(data.error || 'Bağlantı başarısız')
      }
    } catch {
      setTestResult('error')
    }
    setTesting(false)
  }

  async function handleAddSubscription() {
    if (!subscription.id) { toast.error('Subscription ID girin'); return }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/azure/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session?.access_token,
          subscriptionId: subscription.id.trim(),
          subscriptionName: subscription.name.trim() || 'Ana Subscription',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSubscriptionAdded(true)
        toast.success('Subscription eklendi!')
        setCurrentStep(5)
      } else {
        toast.error(data.error || 'Eklenemedi')
      }
    } catch {
      toast.error('Hata oluştu')
    }
    setLoading(false)
  }

  async function handleScan() {
    setScanning(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session?.access_token }),
      })
      const data = await res.json()
      if (data.success) {
        setScanDone(true)
        toast.success(`Tarama tamamlandı! ${data.resourcesScanned} kaynak bulundu.`)
      } else {
        toast.error(data.error || 'Tarama başarısız')
      }
    } catch {
      toast.error('Hata oluştu')
    }
    setScanning(false)
  }

  async function handleComplete() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token }),
    })
    router.push('/dashboard')
  }

  async function handleSkip() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token }),
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Sol Panel — Adımlar */}
      <div className="hidden lg:flex w-72 bg-gray-900 border-r border-gray-800 flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-white font-bold text-sm">UnifyTech</span>
            <p className="text-gray-500 text-xs">CostPilot Kurulum</p>
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((step, i) => {
            const isCompleted = currentStep > step.id
            const isActive = currentStep === step.id
            return (
              <div key={step.id} className="relative">
                <div className={[
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                  isActive ? 'bg-blue-600/20 border border-blue-600/30' :
                  isCompleted ? 'opacity-70' : 'opacity-40'
                ].join(' ')}>
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    isCompleted ? 'bg-green-600 text-white' :
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'
                  ].join(' ')}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-600">Adım {step.id}/5</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className={`absolute left-7 top-full w-0.5 h-2 ${isCompleted ? 'bg-green-600/50' : 'bg-gray-800'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-auto">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Kurulumu atla →
          </button>
        </div>
      </div>

      {/* Sağ Panel — İçerik */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">

          <AnimatePresence mode="wait">

            {/* Adım 1 — Hoş Geldiniz */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="text-6xl mb-6">👋</div>
                <h1 className="text-3xl font-black text-white mb-3">Hoş Geldiniz!</h1>
                <p className="text-gray-400 mb-2">Azure maliyet optimizasyon platformuna hoş geldiniz.</p>
                <p className="text-gray-500 text-sm mb-8">Bu kurulum sihirbazı, Azure bağlantınızı 5 dakikada kurmanıza yardımcı olacak.</p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: '🔍', title: 'Otomatik Tarama', desc: 'Azure kaynaklarınız otomatik taranır' },
                    { icon: '💡', title: 'Akıllı Öneriler', desc: 'AI destekli optimizasyon önerileri' },
                    { icon: '💰', title: '%40 Tasarruf', desc: 'Ortalama maliyet düşürme oranı' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                      <span className="text-2xl block mb-2">{item.icon}</span>
                      <p className="text-xs font-semibold text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
                >
                  Kuruluma Başla →
                </button>
              </motion.div>
            )}

            {/* Adım 2 — Azure Hazırlık */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-4xl mb-4 text-center">☁️</div>
                <h2 className="text-2xl font-black text-white text-center mb-2">Azure Hazırlık</h2>
                <p className="text-gray-400 text-center text-sm mb-8">Azure'da bir Service Principal oluşturmanız gerekiyor.</p>

                <div className="space-y-4 mb-8">
                  {[
                    {
                      step: '1',
                      title: 'Azure Portal\'a Gidin',
                      desc: 'portal.azure.com adresine gidin ve hesabınızla giriş yapın.',
                      color: 'bg-blue-600',
                    },
                    {
                      step: '2',
                      title: 'App Registration Oluşturun',
                      desc: 'Azure Active Directory → App registrations → New registration yolunu izleyin. İsim olarak "CostPilot" yazın.',
                      color: 'bg-purple-600',
                    },
                    {
                      step: '3',
                      title: 'Client Secret Oluşturun',
                      desc: 'Certificates & secrets → New client secret → Ekle. Secret\'ı kopyalayın, bir daha göremezsiniz!',
                      color: 'bg-yellow-600',
                    },
                    {
                      step: '4',
                      title: 'Reader Rolü Verin',
                      desc: 'Subscriptions → Access control (IAM) → Add role assignment → Reader rolünü oluşturduğunuz uygulamaya verin.',
                      color: 'bg-green-600',
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-blue-300">
                    💡 <strong>İpucu:</strong> Sadece <strong>Reader</strong> rolü yeterli. Kaynakları sadece okuyoruz, değiştirmiyoruz.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(1)} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors">
                    ← Geri
                  </button>
                  <button onClick={() => setCurrentStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                    Hazırım →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Adım 3 — Credentials */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-4xl mb-4 text-center">🔑</div>
                <h2 className="text-2xl font-black text-white text-center mb-2">Bağlantı Bilgileri</h2>
                <p className="text-gray-400 text-center text-sm mb-8">Azure Portal&apos;dan aldığınız bilgileri girin.</p>

                <div className="space-y-4 mb-6">
                  {[
                    { label: 'Tenant ID (Directory ID)', key: 'tenantId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', where: 'Azure AD → Properties → Tenant ID' },
                    { label: 'Client ID (Application ID)', key: 'clientId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', where: 'App registrations → Uygulamanız → Application ID' },
                    { label: 'Client Secret', key: 'clientSecret', placeholder: '••••••••••••••••', where: 'App registrations → Certificates & secrets' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
                      <input
                        type={field.key === 'clientSecret' ? 'password' : 'text'}
                        value={credentials[field.key as keyof typeof credentials]}
                        onChange={e => setCredentials({ ...credentials, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <p className="text-xs text-gray-600 mt-1">📍 {field.where}</p>
                    </div>
                  ))}
                </div>

                {/* Test Bağlantısı */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing || !credentials.tenantId || !credentials.clientId || !credentials.clientSecret}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm px-4 py-2 rounded-xl transition-colors border border-gray-700"
                  >
                    {testing ? (
                      <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Test ediliyor...</>
                    ) : 'Bağlantıyı Test Et'}
                  </button>
                  {testResult === 'success' && <span className="text-green-400 text-sm">✓ Bağlantı başarılı!</span>}
                  {testResult === 'error' && <span className="text-red-400 text-sm">✕ Bağlantı başarısız</span>}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(2)} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors">
                    ← Geri
                  </button>
                  <button
                    onClick={handleSaveCredentials}
                    disabled={loading || !credentials.tenantId || !credentials.clientId || !credentials.clientSecret}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Kaydediliyor...</> : 'Kaydet ve Devam Et →'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Adım 4 — Subscription Ekle */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-4xl mb-4 text-center">➕</div>
                <h2 className="text-2xl font-black text-white text-center mb-2">Subscription Ekle</h2>
                <p className="text-gray-400 text-center text-sm mb-8">Taramak istediğiniz Azure Subscription&apos;ı ekleyin.</p>

                <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-blue-300 mb-2">📍 <strong>Subscription ID nerede?</strong></p>
                  <p className="text-xs text-blue-400/70">Azure Portal → Subscriptions → İstediğiniz subscription → Subscription ID</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Subscription ID</label>
                    <input
                      type="text"
                      value={subscription.id}
                      onChange={e => setSubscription({ ...subscription, id: e.target.value })}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">İsim (opsiyonel)</label>
                    <input
                      type="text"
                      value={subscription.name}
                      onChange={e => setSubscription({ ...subscription, name: e.target.value })}
                      placeholder="Örn: Production, Development..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(3)} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors">
                    ← Geri
                  </button>
                  <button
                    onClick={handleAddSubscription}
                    disabled={loading || !subscription.id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Ekleniyor...</> : 'Ekle ve Devam Et →'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Adım 5 — İlk Tarama */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                {scanDone ? (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-6xl mb-6">🎉</motion.div>
                    <h2 className="text-3xl font-black text-white mb-3">Kurulum Tamamlandı!</h2>
                    <p className="text-gray-400 mb-8">Azure kaynaklarınız başarıyla tarandı. Dashboard&apos;a geçmeye hazırsınız!</p>
                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
                    >
                      Dashboard&apos;a Git →
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-6">🚀</div>
                    <h2 className="text-3xl font-black text-white mb-3">Her Şey Hazır!</h2>
                    <p className="text-gray-400 mb-2">Azure bağlantınız kuruldu.</p>
                    <p className="text-gray-500 text-sm mb-8">Şimdi ilk taramayı yaparak kaynaklarınızı keşfedin.</p>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 text-left">
                      <h3 className="text-sm font-semibold text-white mb-3">Tarama ne yapacak?</h3>
                      <div className="space-y-2">
                        {[
                          'Tüm Azure kaynaklarınızı listeler',
                          'Kullanılmayan kaynakları tespit eder',
                          'Maliyet optimizasyon önerileri oluşturur',
                          'Potansiyel tasarruf miktarını hesaplar',
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-900/50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-2.5 h-2.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-xs text-gray-400">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleScan}
                      disabled={scanning}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors text-lg flex items-center justify-center gap-3 mb-3"
                    >
                      {scanning ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Taranıyor...</>
                      ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>İlk Taramayı Başlat</>
                      )}
                    </button>
                    <button
                      onClick={handleComplete}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Taramayı atla, dashboard&apos;a git →
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobil adım göstergesi */}
          <div className="flex justify-center gap-2 mt-8 lg:hidden">
            {steps.map(step => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentStep === step.id ? 'bg-blue-500' :
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}