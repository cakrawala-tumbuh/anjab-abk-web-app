export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
