'use client';

import { useEffect, useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';

interface CompactStorageWidgetProps {
  unionSlug: string;
}

interface StorageData {
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  limitFormatted: string;
  usedFormatted: string;
  remainingFormatted: string;
}

export function CompactStorageWidget({ unionSlug }: CompactStorageWidgetProps) {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStorageUsage() {
      try {
        const response = await fetch(`/api/storage/usage?unionSlug=${unionSlug}`);
        if (response.ok) {
          const data = await response.json();
          setStorageData(data);
        }
      } catch (error) {
        console.error('Failed to fetch storage usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStorageUsage();
  }, [unionSlug]);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <div className="animate-pulse">
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
        </div>
      </div>
    );
  }

  if (!storageData) {
    return null;
  }

  const isNearLimit = storageData.percentUsed >= 80;
  const isAtLimit = storageData.percentUsed >= 100;

  return (
    <div className={`border rounded-lg p-3 mb-4 ${
      isAtLimit
        ? 'bg-red-50 border-red-200'
        : isNearLimit
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Database className={`h-4 w-4 flex-shrink-0 ${
            isAtLimit
              ? 'text-red-600'
              : isNearLimit
                ? 'text-yellow-600'
                : 'text-blue-600'
          }`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-medium text-gray-900">
                Storage Usage
              </span>
              {isNearLimit && (
                <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${
                  isAtLimit ? 'text-red-600' : 'text-yellow-600'
                }`} />
              )}
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-300 ease-in-out ${
                  isAtLimit
                    ? "bg-red-600"
                    : isNearLimit
                      ? "bg-yellow-600"
                      : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(storageData.percentUsed, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-600">
                {storageData.usedFormatted} of {storageData.limitFormatted}
              </span>
              <span className={`text-xs font-medium ${
                isAtLimit
                  ? "text-red-600"
                  : isNearLimit
                    ? "text-yellow-600"
                    : "text-gray-700"
              }`}>
                {storageData.percentUsed}%
              </span>
            </div>
          </div>
        </div>
      </div>
      {isNearLimit && (
        <p className={`text-xs mt-2 ${
          isAtLimit ? 'text-red-700' : 'text-yellow-700'
        }`}>
          {isAtLimit
            ? "Storage limit reached. Delete files or upgrade your plan to upload more."
            : "Running low on storage. Consider upgrading or removing unused files."}
        </p>
      )}
    </div>
  );
}
