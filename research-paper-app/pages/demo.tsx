import React from 'react';
import Head from 'next/head';
import SearchResults from '@/components/SearchResults';
import type { Paper } from '@/types/paper';

// Mock data for demo
const mockPapers: Paper[] = [
  {
    paperId: '1',
    title: 'Deep Learning for Natural Language Processing: A Comprehensive Survey',
    abstract: 'This paper provides a comprehensive survey of deep learning approaches for natural language processing tasks...',
    year: 2023,
    venue: 'Computational Linguistics',
    citationCount: 156,
    authors: [
      { authorId: '1', name: 'John Smith' },
      { authorId: '2', name: 'Jane Doe' }
    ],
    isOpenAccess: true,
    type: 'article'
  },
  {
    paperId: '2',
    title: 'Machine Learning Applications in Healthcare: Current Trends and Future Directions',
    abstract: 'The application of machine learning in healthcare has shown promising results in various domains...',
    year: 2022,
    venue: 'Nature Medicine',
    citationCount: 89,
    authors: [
      { authorId: '3', name: 'Alice Johnson' },
      { authorId: '4', name: 'Bob Wilson' }
    ],
    isOpenAccess: false,
    type: 'article'
  },
  {
    paperId: '3',
    title: 'Quantum Computing: Principles and Applications',
    abstract: 'Quantum computing represents a paradigm shift in computational capabilities...',
    year: 2024,
    venue: 'Science',
    citationCount: 23,
    authors: [
      { authorId: '5', name: 'Charlie Brown' }
    ],
    isOpenAccess: true,
    type: 'article'
  }
];

export default function DemoPage() {
  const handleSearch = async (query: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockPapers.filter(paper => 
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.abstract?.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <>
      <Head>
        <title>Filtering System Demo - Research Paper Search</title>
        <meta name="description" content="Demo of the advanced filtering system for research papers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Filtering System Demo
            </h1>
            <p className="text-lg text-gray-600">
              Try the advanced filtering system with example data
            </p>
          </div>

          {/* Demo Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Use the Filters</h2>
            <ul className="text-blue-800 space-y-1">
              <li>• <strong>Year Range:</strong> Adjust the sliders to filter by publication year</li>
              <li>• <strong>Publication Type:</strong> Select specific types like articles, preprints, or books</li>
              <li>• <strong>Open Access:</strong> Toggle to show only open access papers</li>
              <li>• <strong>Citation Count:</strong> Filter by minimum citation count</li>
              <li>• <strong>Sort By:</strong> Choose how to sort results (relevance, citations, date)</li>
              <li>• <strong>Research Topics:</strong> Search and select specific research fields</li>
            </ul>
          </div>

          {/* Search Results with Filters */}
          <SearchResults
            query="machine learning"
            initialResults={mockPapers}
            onSearch={handleSearch}
          />
        </div>
      </main>
    </>
  );
}
