export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Raporlar</h2>
        <p className="text-gray-500 text-sm">Aylık ve haftalık maliyet raporları burada oluşturulabilir.</p>
      </div>
    </div>
  )
}