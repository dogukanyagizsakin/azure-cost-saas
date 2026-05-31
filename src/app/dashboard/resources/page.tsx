export default function ResourcesPage() {
  return (
    <div className="p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Kaynaklar</h2>
        <p className="text-gray-500 text-sm">Azure subscription bağlandıktan sonra tüm kaynaklar burada listelenir.</p>
      </div>
    </div>
  )
}