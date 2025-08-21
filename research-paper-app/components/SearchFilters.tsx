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
  resultCount?: number;
}

export default function SearchFilters({ filters, onFiltersChange, resultCount }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [filteredTopics, setFilteredTopics] = useState(RESEARCH_TOPICS);

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.yearMin !== DEFAULT_FILTERS.yearMin || filters.yearMax !== DEFAULT_FILTERS.yearMax) count++;
    if (filters.types.length !== DEFAULT_FILTERS.types.length || 
        !filters.types.every(type => DEFAULT_FILTERS.types.includes(type))) count++;
    if (filters.openAccess !== DEFAULT_FILTERS.openAccess) count++;
    if (filters.minCitations !== DEFAULT_FILTERS.minCitations) count++;
    if (filters.sortBy !== DEFAULT_FILTERS.sortBy) count++;
    if (filters.topics.length > 0) count++;
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

  const updateFilter = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const toggleTopic = (topicId: string) => {
    const newTopics = filters.topics.includes(topicId)
      ? filters.topics.filter(id => id !== topicId)
      : [...filters.topics, topicId];
    updateFilter('topics', newTopics);
  };

  const clearAllFilters = () => {
    onFiltersChange(DEFAULT_FILTERS);
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
              Publication Year ({filters.yearMin} - {filters.yearMax})
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="1900"
                max="2024"
                value={filters.yearMin}
                onChange={(e) => updateFilter('yearMin', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="1900"
                max="2024"
                value={filters.yearMax}
                onChange={(e) => updateFilter('yearMax', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{filters.yearMin}</span>
                <span>{filters.yearMax}</span>
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
                    checked={filters.types.includes(type.value)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...filters.types, type.value]
                        : filters.types.filter(t => t !== type.value);
                      updateFilter('types', newTypes);
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
                checked={filters.openAccess}
                onChange={(e) => updateFilter('openAccess', e.target.checked)}
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
              value={filters.minCitations.toString()}
              onChange={(e) => updateFilter('minCitations', parseInt(e.target.value))}
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
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
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
              {filters.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.topics.map((topicId) => {
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
                      checked={filters.topics.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{topic.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
