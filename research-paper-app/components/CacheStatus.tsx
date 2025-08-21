import React from 'react';

interface CacheStatusProps {
  fromCache: boolean;
  cacheHitRate: number;
  rateLimited: boolean;
}

export function CacheStatus({ fromCache, cacheHitRate, rateLimited }: CacheStatusProps) {
  const getCacheIcon = () => {
    if (fromCache) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  };

  const getRateLimitIcon = () => {
    if (rateLimited) {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    return null;
  };

  const getCacheColor = () => {
    if (cacheHitRate >= 0.8) return 'text-green-600 dark:text-green-400';
    if (cacheHitRate >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Cache Status */}
          <div className="flex items-center gap-2">
            {getCacheIcon()}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fromCache ? 'From Cache' : 'Fresh Results'}
            </span>
          </div>

          {/* Cache Hit Rate */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className={`text-sm font-medium ${getCacheColor()}`}>
              {Math.round(cacheHitRate * 100)}% cache hit
            </span>
          </div>
        </div>

        {/* Rate Limit Warning */}
        {rateLimited && (
          <div className="flex items-center gap-2">
            {getRateLimitIcon()}
            <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              Rate limited
            </span>
          </div>
        )}
      </div>

      {/* Performance Info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {fromCache ? (
          <span>Results served from cache for faster performance</span>
        ) : (
          <span>Results fetched from Semantic Scholar API</span>
        )}
        {rateLimited && (
          <span className="ml-2">• Some requests were rate limited</span>
        )}
      </div>
    </div>
  );
}
