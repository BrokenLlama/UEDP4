import React, { useState, useCallback } from 'react';
import type { Paper, CacheResult } from '@/types/paper';
import { PaperCard } from './PaperCard';
import { CacheStatus } from './CacheStatus';

interface SearchInterfaceProps {
  onPaperSelect?: (paper: Paper) => void;
}

export default function SearchInterface({ onPaperSelect }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{
    fromCache: boolean;
    cacheHitRate: number;
    rateLimited: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setCacheInfo(null);

    try {
      const response = await fetch('/api/search-papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit exceeded. Please wait ${data.retryAfter || 60} seconds before trying again.`);
        } else {
          setError(data.error || 'Search failed');
        }
        return;
      }

      const result: CacheResult = data.data;
      setResults(result.successful);
      setCacheInfo(data.cacheInfo);

      // Add to search history
      if (!searchHistory.includes(query.trim())) {
        setSearchHistory(prev => [query.trim(), ...prev.slice(0, 9)]);
      }

    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [query, searchHistory]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    // Auto-search when clicking history item
    setTimeout(() => {
      setQuery(historyQuery);
      handleSearch();
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Research Paper Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Intelligent search with multi-level caching and rate limit handling
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for research papers..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recent searches:</p>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((historyQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(historyQuery)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {historyQuery}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Cache Status */}
      {cacheInfo && (
        <CacheStatus
          fromCache={cacheInfo.fromCache}
          cacheHitRate={cacheInfo.cacheHitRate}
          rateLimited={cacheInfo.rateLimited}
        />
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Search Results ({results.length})
            </h2>
            <button
              onClick={() => setResults([])}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Results
            </button>
          </div>
          
          <div className="grid gap-4">
            {results.map((paper) => (
              <PaperCard
                key={paper.paperId}
                paper={paper}
                onSelect={onPaperSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No papers found for "{query}". Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
