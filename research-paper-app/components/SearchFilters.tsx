'use client';

import React, { useState, useEffect } from 'react';
import { 
  Filters, 
  DEFAULT_FILTERS, 
  PUBLICATION_TYPES, 
  CITATION_OPTIONS, 
  SORT_OPTIONS, 
  RESEARCH_TOPICS,
  type ResearchTopic 
} from '@/types/filters';

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onApplyFilters: () => void;
  resultCount?: number;
  loading?: boolean;
}

export default function SearchFilters({ filters, onFiltersChange, onApplyFilters, resultCount, loading }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [filteredTopics, setFilteredTopics] = useState(RESEARCH_TOPICS);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.yearMin !== DEFAULT_FILTERS.yearMin || localFilters.yearMax !== DEFAULT_FILTERS.yearMax) count++;
    if (localFilters.types.length !== DEFAULT_FILTERS.types.length || 
        !localFilters.types.every(type => DEFAULT_FILTERS.types.includes(type))) count++;
    if (localFilters.openAccess !== DEFAULT_FILTERS.openAccess) count++;
    if (localFilters.minCitations !== DEFAULT_FILTERS.minCitations) count++;
    if (localFilters.sortBy !== DEFAULT_FILTERS.sortBy) count++;
    if (localFilters.topics.length > 0) count++;
    return count;
  };

  // Filter topics based on search
  useEffect(() => {
    if (topicSearch.trim() === '') {
      setFilteredTopics(RESEARCH_TOPICS);
    } else {
      const filtered = RESEARCH_TOPICS.filter(topic =>
        topic.displayName.toLowerCase().includes(topicSearch.toLowerCase())
      );
      setFilteredTopics(filtered);
    }
  }, [topicSearch]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateLocalFilter = (key: keyof Filters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const toggleTopic = (topicId: string) => {
    const newTopics = localFilters.topics.includes(topicId)
      ? localFilters.topics.filter(id => id !== topicId)
      : [...localFilters.topics, topicId];
    updateLocalFilter('topics', newTopics);
  };

  const clearAllFilters = () => {
    const defaultFilters = DEFAULT_FILTERS;
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {resultCount !== undefined && (
              <span className="text-sm text-gray-600">
                {resultCount.toLocaleString()} results
              </span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="p-4 space-y-6">
          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication Year ({localFilters.yearMin} - {localFilters.yearMax})
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="1900"
                max="2024"
                value={localFilters.yearMin}
                onChange={(e) => updateLocalFilter('yearMin', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="1900"
                max="2024"
                value={localFilters.yearMax}
                onChange={(e) => updateLocalFilter('yearMax', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{localFilters.yearMin}</span>
                <span>{localFilters.yearMax}</span>
              </div>
            </div>
          </div>

          {/* Publication Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication Type
            </label>
            <div className="space-y-2">
              {PUBLICATION_TYPES.map((type) => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.types.includes(type.value)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...localFilters.types, type.value]
                        : localFilters.types.filter(t => t !== type.value);
                      updateLocalFilter('types', newTypes);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Open Access */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.openAccess}
                onChange={(e) => updateLocalFilter('openAccess', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Open Access Only</span>
            </label>
          </div>

          {/* Citation Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Citations
            </label>
            <select
              value={localFilters.minCitations.toString()}
              onChange={(e) => updateLocalFilter('minCitations', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {CITATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={localFilters.sortBy}
              onChange={(e) => updateLocalFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Research Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Topics
            </label>
            <div className="space-y-2">
              {/* Search input */}
              <input
                type="text"
                placeholder="Search topics..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Selected topics */}
              {localFilters.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {localFilters.topics.map((topicId) => {
                    const topic = RESEARCH_TOPICS.find(t => t.id === topicId);
                    return topic ? (
                      <span
                        key={topicId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {topic.displayName}
                        <button
                          onClick={() => toggleTopic(topicId)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Topic options */}
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredTopics.map((topic) => (
                  <label key={topic.id} className="flex items-center px-3 py-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={localFilters.topics.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{topic.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Applying...
                </div>
              ) : (
                'Apply Filters'
              )}
            </button>
            
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
