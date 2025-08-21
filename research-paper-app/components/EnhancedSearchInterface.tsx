'use client';

import React, { useState, useCallback } from 'react';
import type { Paper, CacheResult } from '@/types/paper';
import type { Filters } from '@/types/filters';
import { PaperCard } from './PaperCard';
import { CacheStatus } from './CacheStatus';
import SearchResults from './SearchResults';

interface EnhancedSearchInterfaceProps {
  onPaperSelect?: (paper: Paper) => void;
}

export default function EnhancedSearchInterface({ onPaperSelect }: EnhancedSearchInterfaceProps) {
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
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string, filters?: Filters) => {
    if (!searchQuery.trim()) return [];

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
          query: searchQuery.trim(),
          limit: 25,
          filters: filters || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait ${data.retryAfter || 60} seconds before trying again.`);
        } else {
          throw new Error(data.error || 'Search failed');
        }
      }

      const result: CacheResult = data.data;
      const papers = result.successful;
      
      setResults(papers);
      setCacheInfo(data.cacheInfo);
      setShowResults(true);

      // Add to search history
      if (!searchHistory.includes(searchQuery.trim())) {
        setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]);
      }

      return papers;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchHistory]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch(query);
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  const handleClearResults = () => {
    setResults([]);
    setShowResults(false);
    setCacheInfo(null);
    setError(null);
  };

  // If we have results and should show them, render the SearchResults component
  if (showResults && results.length > 0) {
    return (
      <SearchResults
        query={query}
        initialResults={results}
        onSearch={handleSearch}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Research Paper Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced search with intelligent filtering and multi-level caching
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
            onClick={() => handleSearch(query)}
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

      {/* Quick Results (before going to full results view) */}
      {results.length > 0 && !showResults && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quick Results ({results.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResults(true)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                View with Filters
              </button>
              <button
                onClick={handleClearResults}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {results.slice(0, 5).map((paper) => (
              <PaperCard
                key={paper.paperId}
                paper={paper}
                onSelect={onPaperSelect}
              />
            ))}
          </div>
          
          {results.length > 5 && (
            <div className="text-center">
              <button
                onClick={() => setShowResults(true)}
                className="px-6 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View all {results.length} results with advanced filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No papers found for "{query}". Try a different search term or use the advanced filters.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!loading && !error && results.length === 0 && !query && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Search for research papers</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter a search term to find papers, then use advanced filters to refine your results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
