export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav skeleton */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="hidden sm:flex gap-3">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-4">
          <div className="h-12 w-2/3 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-6 w-1/2 bg-gray-100 rounded animate-pulse mx-auto" />
          <div className="flex gap-3 justify-center pt-4">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
