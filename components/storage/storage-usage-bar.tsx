'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StorageUsageBarProps {
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

export function StorageUsageBar({ unionSlug }: StorageUsageBarProps) {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mt-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageData) {
    return null;
  }

  const isNearLimit = storageData.percentUsed >= 80;
  const isAtLimit = storageData.percentUsed >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5" />
          Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning alert when near or at limit */}
        {isNearLimit && (
          <Alert variant={isAtLimit ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isAtLimit
                ? "You've reached your storage limit. Please delete some files or upgrade your plan to upload more."
                : "You're running low on storage. Consider upgrading your plan or removing unused files."}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
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

          {/* Storage stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {storageData.usedFormatted} of {storageData.limitFormatted} used
            </span>
            <span className={`font-medium ${
              isAtLimit
                ? "text-red-600"
                : isNearLimit
                  ? "text-yellow-600"
                  : "text-gray-900"
            }`}>
              {storageData.percentUsed}%
            </span>
          </div>

          {/* Remaining storage */}
          <div className="text-xs text-gray-500">
            {storageData.remainingFormatted} remaining
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
