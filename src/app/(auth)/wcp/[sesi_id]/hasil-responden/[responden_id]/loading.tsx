export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-white" />
    </div>
  );
}
