export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 animate-pulse rounded-md bg-gray-200" />
      <div className="h-8 w-56 animate-pulse rounded-md bg-gray-200" />
      {[1, 2, 3].map((d) => (
        <div key={d} className="h-56 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}
