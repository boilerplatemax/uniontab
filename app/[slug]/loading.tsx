import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Cover Photo Skeleton */}
      <div className="w-full h-64 bg-gray-200 animate-pulse" />

      {/* Profile Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-6">
          <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white animate-pulse" />
          <div className="text-center sm:text-left flex-1 pb-2">
            <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse mx-auto sm:mx-0" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto sm:mx-0" />
          </div>
        </div>

        {/* Content Loading */}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
