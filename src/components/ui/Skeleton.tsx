export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded-xl ${className}`} />
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-800/50">
      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
      <td className="px-6 py-4"><Skeleton className="h-5 w-28 rounded-full" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-6 py-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
    </tr>
  )
}

export function RecommendationSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="h-5 w-14 rounded-full flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}

export function ResourcesSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-800/50 last:border-0">
            <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-40" />
    </div>
  )
}