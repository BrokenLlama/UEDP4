import React, { useState, useEffect } from 'react';
import type { Citation } from '@/types/paper';

interface CitationsListProps {
  paperId: string;
}

export function CitationsList({ paperId }: CitationsListProps) {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCitations();
  }, [paperId]);

  const fetchCitations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/paper-citations?paperId=${paperId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch citations');
      }

      setCitations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch citations');
    } finally {
      setLoading(false);
    }
  };

  const formatAuthors = (authors?: Array<{ name: string }>) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.map(a => a.name).join(', ');
    return `${authors.slice(0, 3).map(a => a.name).join(', ')} et al.`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading citations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchCitations}
          className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (citations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No citations found for this paper.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Citations ({citations.length})
        </h3>
        <button
          onClick={fetchCitations}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {citations.map((citation, index) => (
          <div
            key={citation.paperId}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {citation.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {formatAuthors(citation.authors)}
                  {citation.year && ` • ${citation.year}`}
                  {citation.venue && ` • ${citation.venue}`}
                </p>
              </div>
              
              <div className="flex gap-2 ml-4">
                {citation.url && (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </a>
                )}
                {citation.doi && (
                  <a
                    href={`https://doi.org/${citation.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    DOI
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
