'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'tr' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved === 'tr' || saved === 'en') setLanguageState(saved)
  }, [])

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  function t(key: string): string {
    const keys = key.split('.')
    let value: any = translations[language]
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

const translations = {
  tr: {
    // Auth
    auth: {
      login: 'Giriş Yap',
      logout: 'Çıkış Yap',
      email: 'E-posta',
      password: 'Şifre',
      forgotPassword: 'Şifremi unuttum',
      loginWithGoogle: 'Google ile Giriş',
      loginWithMicrosoft: 'Microsoft ile Giriş',
      loginWithEmail: 'E-posta ile Giriş',
      adminLogin: 'Yönetici Girişi',
      welcomeBack: 'Tekrar Hoş Geldiniz',
      loginToContinue: 'Devam etmek için giriş yapın',
    },
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      resources: 'Kaynaklar',
      recommendations: 'Öneriler',
      reports: 'Raporlar',
      finops: 'FinOps Skoru',
      savings: 'Tasarruf Planı',
      settings: 'Ayarlar',
      quickScan: 'Hızlı Tara',
      support: 'Destek',
      upgradePro: 'Pro\'ya Geç',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      lastScan: 'Son tarama',
      subscription: 'Subscription',
      scanNow: 'Şimdi Tara',
      scanning: 'Taranıyor...',
      monthlyCost: 'Aylık Maliyet',
      savingsOpportunity: 'Tasarruf Fırsatı',
      totalResources: 'Toplam Kaynak',
      monthEndEstimate: 'Ay Sonu Tahmini',
      notScanned: 'Tarama yapılmamış',
      noRecommendations: 'Öneri bulunamadı',
      costTrend: 'Son 7 Günlük Maliyet Trendi',
      resourceDistribution: 'Kaynak Dağılımı',
      monthlyComparison: 'Aylık Maliyet Karşılaştırması',
      topResources: 'En Pahalı Kaynaklar',
      optimizationRecs: 'Optimizasyon Önerileri',
      scanLogs: 'Son Tarama Logları',
      viewAll: 'Tüm Kaynakları Gör',
      openRecs: 'açık',
      resourceStatus: 'Kaynak Durumu',
      active: 'Aktif',
      idle: 'Boşta',
      orphan: 'Orphan',
      monthlyBudget: 'Aylık Bütçe',
      budgetExceeded: 'Aşıldı!',
      estimatedCost: '~ Tahmini maliyet (Retail Prices)',
      estimatedValue: '~ Tahmini değer',
      estimatedBanner: 'Tahmini maliyet gösteriliyor',
      estimatedBannerDesc: 'Bu subscription türünde Cost Management API desteklenmiyor. Maliyet verileri Azure Retail Prices API üzerinden tahmin edilmektedir.',
    },
    // Resources
    resources: {
      title: 'Kaynaklar',
      totalResources: 'Toplam Kaynak',
      totalCost: 'Toplam Maliyet',
      active: 'Aktif',
      resourceGroup: 'Resource Group',
      resourceName: 'Kaynak Adı',
      type: 'Tür',
      location: 'Konum',
      cost: 'Maliyet',
      status: 'Durum',
      search: 'Kaynak veya resource group ara...',
      allTypes: 'Tüm Türler',
      noResults: 'Arama kriterlerine uygun kaynak bulunamadı',
      noResources: 'Henüz kaynak yok',
      noResourcesDesc: 'Dashboard\'dan "Şimdi Tara" butonuna tıklayarak Azure kaynaklarınızı tarayın.',
      azureRequired: 'Azure Bağlantısı Gerekli',
      azureRequiredDesc: 'Kaynakları görmek için önce Azure subscription\'ınızı bağlamanız gerekiyor.',
      goToSettings: 'Ayarlara Git',
      goToDashboard: 'Dashboard\'a Git',
      previous: '← Önceki',
      next: 'Sonraki →',
      page: 'Sayfa',
    },
    // Recommendations
    recommendations: {
      title: 'Öneriler',
      total: 'Toplam Öneri',
      open: 'Açık Öneri',
      applied: 'Uygulanan',
      savings: 'Potansiyel Tasarruf',
      apply: 'Uygula',
      dismiss: 'Reddet',
      reopen: 'Geri Al',
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük',
      perMonth: '/ay tasarruf',
      filter: {
        open: 'Açık',
        applied: 'Uygulanan',
        dismissed: 'Reddedilen',
        all: 'Tümü',
      },
      noRecs: 'Henüz öneri yok',
      noRecsDesc: 'Tarama tamamlandıktan sonra optimizasyon önerileri burada görünecek.',
      startScan: 'Taramayı Başlat',
    },
    // Settings
    settings: {
      title: 'Ayarlar',
      azure: 'Azure Bağlantısı',
      notifications: 'Bildirimler',
      budget: 'Bütçe',
      team: 'Takım',
      account: 'Hesap',
      save: 'Kaydet',
      test: 'Bağlantıyı Test Et',
      connected: 'Bağlı',
      notConnected: 'Bağlı Değil',
    },
    // Common
    common: {
      loading: 'Yükleniyor...',
      error: 'Hata',
      success: 'Başarılı',
      cancel: 'İptal',
      confirm: 'Onayla',
      delete: 'Sil',
      edit: 'Düzenle',
      add: 'Ekle',
      save: 'Kaydet',
      close: 'Kapat',
      back: 'Geri',
      next: 'İleri',
      previous: 'Önceki',
      yes: 'Evet',
      no: 'Hayır',
      monthly: '/ay',
      perMonth: '/ay',
    },
    // Scan
    scan: {
      success: 'Tarama tamamlandı!',
      failed: 'Tarama başarısız',
      resources: 'kaynak',
      recommendations: 'öneri bulundu',
      running: 'Çalışıyor',
      completed: 'Başarılı',
      failed2: 'Hata',
    },
    // Reports
    reports: {
      title: 'Raporlar',
      subtitle: 'CEO ve yöneticiler için profesyonel raporlar',
      pdf: 'PDF Raporu',
      excel: 'Excel Raporu',
      ppt: 'PowerPoint Sunumu',
      download: 'İndir',
      scanHistory: 'Tarama Geçmişi',
      noScans: 'Henüz tarama yapılmamış',
      date: 'Tarih',
      scannedResources: 'Taranan Kaynak',
      recommendations: 'Öneri',
      totalCost: 'Toplam Maliyet',
      duration: 'Süre',
      status: 'Durum',
    },
    // Onboarding
    onboarding: {
      welcome: 'Hoş Geldiniz!',
      step1Title: 'Hoş Geldiniz',
      step2Title: 'Azure Hazırlık',
      step3Title: 'Bağlantı Bilgileri',
      step4Title: 'Subscription Ekle',
      step5Title: 'İlk Tarama',
      startSetup: 'Kuruluma Başla →',
      skip: 'Kurulumu atla →',
      back: '← Geri',
      next: 'Hazırım →',
      save: 'Kaydet ve Devam Et →',
      test: 'Bağlantıyı Test Et',
      testSuccess: 'Bağlantı başarılı!',
      testFailed: 'Bağlantı başarısız',
      scanStart: 'İlk Taramayı Başlat',
      scanning: 'Taranıyor...',
      complete: 'Dashboard\'a Git →',
      skipScan: 'Taramayı atla, dashboard\'a git →',
      setupComplete: 'Kurulum Tamamlandı!',
    },
    // Plan
    plan: {
      free: 'Free Plan',
      pro: 'Pro Plan',
      daysLeft: 'gün',
      upgrade: 'Pro\'ya geç →',
      trialExpired: 'Deneme Süresi Doldu',
    },
    // Azure status
    azure: {
      connected: 'Azure Bağlı',
      notConnected: 'Azure Bağlı Değil',
    },
  },
  en: {
    // Auth
    auth: {
      login: 'Login',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password',
      loginWithGoogle: 'Login with Google',
      loginWithMicrosoft: 'Login with Microsoft',
      loginWithEmail: 'Login with Email',
      adminLogin: 'Admin Login',
      welcomeBack: 'Welcome Back',
      loginToContinue: 'Login to continue',
    },
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      resources: 'Resources',
      recommendations: 'Recommendations',
      reports: 'Reports',
      finops: 'FinOps Score',
      savings: 'Savings Plan',
      settings: 'Settings',
      quickScan: 'Quick Scan',
      support: 'Support',
      upgradePro: 'Upgrade to Pro',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      lastScan: 'Last scan',
      subscription: 'Subscription',
      scanNow: 'Scan Now',
      scanning: 'Scanning...',
      monthlyCost: 'Monthly Cost',
      savingsOpportunity: 'Savings Opportunity',
      totalResources: 'Total Resources',
      monthEndEstimate: 'Month-End Estimate',
      notScanned: 'Not scanned yet',
      noRecommendations: 'No recommendations found',
      costTrend: 'Last 7 Days Cost Trend',
      resourceDistribution: 'Resource Distribution',
      monthlyComparison: 'Monthly Cost Comparison',
      topResources: 'Most Expensive Resources',
      optimizationRecs: 'Optimization Recommendations',
      scanLogs: 'Recent Scan Logs',
      viewAll: 'View All Resources',
      openRecs: 'open',
      resourceStatus: 'Resource Status',
      active: 'Active',
      idle: 'Idle',
      orphan: 'Orphan',
      monthlyBudget: 'Monthly Budget',
      budgetExceeded: 'Exceeded!',
      estimatedCost: '~ Estimated cost (Retail Prices)',
      estimatedValue: '~ Estimated value',
      estimatedBanner: 'Estimated cost shown',
      estimatedBannerDesc: 'Cost Management API is not supported for this subscription type. Cost data is estimated using Azure Retail Prices API.',
    },
    // Resources
    resources: {
      title: 'Resources',
      totalResources: 'Total Resources',
      totalCost: 'Total Cost',
      active: 'Active',
      resourceGroup: 'Resource Group',
      resourceName: 'Resource Name',
      type: 'Type',
      location: 'Location',
      cost: 'Cost',
      status: 'Status',
      search: 'Search resource or resource group...',
      allTypes: 'All Types',
      noResults: 'No resources found matching search criteria',
      noResources: 'No resources yet',
      noResourcesDesc: 'Click "Scan Now" from the Dashboard to scan your Azure resources.',
      azureRequired: 'Azure Connection Required',
      azureRequiredDesc: 'You need to connect your Azure subscription to view resources.',
      goToSettings: 'Go to Settings',
      goToDashboard: 'Go to Dashboard',
      previous: '← Previous',
      next: 'Next →',
      page: 'Page',
    },
    // Recommendations
    recommendations: {
      title: 'Recommendations',
      total: 'Total Recommendations',
      open: 'Open',
      applied: 'Applied',
      savings: 'Potential Savings',
      apply: 'Apply',
      dismiss: 'Dismiss',
      reopen: 'Reopen',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      perMonth: '/mo savings',
      filter: {
        open: 'Open',
        applied: 'Applied',
        dismissed: 'Dismissed',
        all: 'All',
      },
      noRecs: 'No recommendations yet',
      noRecsDesc: 'Optimization recommendations will appear here after scanning.',
      startScan: 'Start Scan',
    },
    // Settings
    settings: {
      title: 'Settings',
      azure: 'Azure Connection',
      notifications: 'Notifications',
      budget: 'Budget',
      team: 'Team',
      account: 'Account',
      save: 'Save',
      test: 'Test Connection',
      connected: 'Connected',
      notConnected: 'Not Connected',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      save: 'Save',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      yes: 'Yes',
      no: 'No',
      monthly: '/mo',
      perMonth: '/mo',
    },
    // Scan
    scan: {
      success: 'Scan completed!',
      failed: 'Scan failed',
      resources: 'resources',
      recommendations: 'recommendations found',
      running: 'Running',
      completed: 'Completed',
      failed2: 'Failed',
    },
    // Reports
    reports: {
      title: 'Reports',
      subtitle: 'Professional reports for CEOs and managers',
      pdf: 'PDF Report',
      excel: 'Excel Report',
      ppt: 'PowerPoint Presentation',
      download: 'Download',
      scanHistory: 'Scan History',
      noScans: 'No scans yet',
      date: 'Date',
      scannedResources: 'Scanned Resources',
      recommendations: 'Recommendations',
      totalCost: 'Total Cost',
      duration: 'Duration',
      status: 'Status',
    },
    // Onboarding
    onboarding: {
      welcome: 'Welcome!',
      step1Title: 'Welcome',
      step2Title: 'Azure Setup',
      step3Title: 'Credentials',
      step4Title: 'Add Subscription',
      step5Title: 'First Scan',
      startSetup: 'Start Setup →',
      skip: 'Skip setup →',
      back: '← Back',
      next: 'Ready →',
      save: 'Save & Continue →',
      test: 'Test Connection',
      testSuccess: 'Connection successful!',
      testFailed: 'Connection failed',
      scanStart: 'Start First Scan',
      scanning: 'Scanning...',
      complete: 'Go to Dashboard →',
      skipScan: 'Skip scan, go to dashboard →',
      setupComplete: 'Setup Complete!',
    },
    // Plan
    plan: {
      free: 'Free Plan',
      pro: 'Pro Plan',
      daysLeft: 'days',
      upgrade: 'Upgrade to Pro →',
      trialExpired: 'Trial Expired',
    },
    // Azure status
    azure: {
      connected: 'Azure Connected',
      notConnected: 'Azure Not Connected',
    },
  },
}