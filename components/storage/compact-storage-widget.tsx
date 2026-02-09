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
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <div className="animate-pulse">
          <div className="h-1.5 bg-gray-200 rounded-full w-full"></div>
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
    <div className={`border rounded-lg px-3 py-2 ${
      isAtLimit
        ? 'bg-red-50 border-red-200'
        : isNearLimit
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <Database className={`h-3.5 w-3.5 flex-shrink-0 ${
          isAtLimit
            ? 'text-red-600'
            : isNearLimit
              ? 'text-yellow-600'
              : 'text-gray-500'
        }`} />
        <div className="min-w-0 flex-1">
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
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {storageData.usedFormatted} / {storageData.limitFormatted}
        </span>
        {isNearLimit && (
          <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${
            isAtLimit ? 'text-red-600' : 'text-yellow-600'
          }`} />
        )}
      </div>
    </div>
  );
}
