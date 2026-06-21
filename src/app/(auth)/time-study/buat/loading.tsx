export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="form-card space-y-5 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ))}
        <div className="h-9 w-28 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
