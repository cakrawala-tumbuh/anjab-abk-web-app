export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 animate-pulse rounded-md bg-gray-200" />
      <div className="h-8 w-56 animate-pulse rounded-md bg-gray-200" />
      {[1, 2, 3, 4].map((d) => (
        <div key={d} className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-md bg-gray-200" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ))}
    </div>
  );
}
