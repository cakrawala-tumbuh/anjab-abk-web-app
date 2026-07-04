export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="table-container">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-gray-100 px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
