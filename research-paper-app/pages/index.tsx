import React, { useState } from 'react';
import Head from 'next/head';
import EnhancedSearchInterface from '@/components/EnhancedSearchInterface';
import type { Paper } from '@/types/paper';

export default function Home() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const handlePaperSelect = (paper: Paper) => {
    setSelectedPaper(paper);
    // You can add logic here to save to collections, show details, etc.
    console.log('Selected paper:', paper);
  };

  return (
    <>
      <Head>
        <title>Research Paper Search - Advanced Filtering System</title>
        <meta name="description" content="Advanced research paper search with intelligent filtering, caching and rate limit handling" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Research Paper Search
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Collections
                </button>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Settings
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto py-8">
          <EnhancedSearchInterface onPaperSelect={handlePaperSelect} />
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p className="text-sm">
                Powered by OpenAlex API with advanced filtering and intelligent caching
              </p>
              <p className="text-xs mt-2">
                Built with Next.js, Supabase, and Google Gemini AI
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
