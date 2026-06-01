export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-800 rounded-lg ${className}`}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-800/50">
      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
      <td className="px-6 py-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
    </tr>
  )
}

export function RecommendationSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="h-5 w-16 rounded-full mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-xl mb-6" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}