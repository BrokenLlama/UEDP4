import React, { useState } from 'react';
import { useRouter } from 'next/router';
import type { Paper } from '@/types/paper';

interface PaperCardProps {
  paper: Paper;
  onSelect?: (paper: Paper) => void;
}

export function PaperCard({ paper, onSelect }: PaperCardProps) {
  const router = useRouter();

  const handleTitleClick = () => {
    router.push(`/paper/${paper.paperId}`);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(paper);
    }
  };

  const formatAuthors = (authors?: Array<{ name: string }>) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.map(a => a.name).join(', ');
    return `${authors.slice(0, 3).map(a => a.name).join(', ')} et al.`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Title - Clickable to go to detail page */}
      <h3 
        className="text-lg font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
        onClick={handleTitleClick}
      >
        {paper.title}
      </h3>

      {/* Authors */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {formatAuthors(paper.authors)}
      </p>

      {/* Metadata Row */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
        {paper.year && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {paper.year}
          </span>
        )}
        
        {paper.venue && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {paper.venue}
          </span>
        )}

        {paper.citationCount !== undefined && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h6" />
            </svg>
            {paper.citationCount} citations
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Paper
          </a>
        )}

        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            DOI
          </a>
        )}

        <button
          onClick={handleCardClick}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add to Collection
        </button>

        {paper.pdfUrl && (
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/download-pdf', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    pdfUrl: paper.pdfUrl,
                    filename: `${paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
                  })
                });
                
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }
              } catch (error) {
                console.error('Error downloading PDF:', error);
              }
            }}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        )}
      </div>
    </div>
  );
}
