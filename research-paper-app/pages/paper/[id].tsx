import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import type { Paper } from '@/types/paper';
import { OpenAlexClient, type OpenAlexWork } from '@/lib/openalex-client';
import { CitationsList } from '@/components/CitationsList';
import { PaperChat } from '@/components/PaperChat';
import { CollectionsManager } from '@/components/CollectionsManager';

interface PaperDetailPageProps {
  paper: Paper | null;
}

function reconstructAbstract(invertedIndex?: Record<string, number[]>): string | null {
  if (!invertedIndex) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    positions.forEach(pos => { words[pos] = word; });
  }
  const text = words.join(' ').trim();
  return text.length > 0 ? text : null;
}

function openAlexWorkToPaper(work: OpenAlexWork): Paper {
  return {
    paperId: work.id.split('/').pop() || work.id,
    title: work.display_name,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    year: work.publication_year || null,
    venue: work.primary_location?.source?.display_name || null,
    citationCount: work.cited_by_count || null,
    url: work.primary_location?.landing_page_url || work.open_access.oa_url || null,
    doi: work.doi || null,
    authors: work.authorships?.map(a => ({ 
      authorId: a.author.id.split('/').pop() || a.author.id, 
      name: a.author.display_name 
    })) || [],
    isOpenAccess: work.open_access?.is_oa || false,
    pdfUrl: work.open_access?.oa_url || null,
    type: work.type || null,
    concepts: (work as any).concepts?.map((c: any) => ({ 
      id: c.id, 
      name: c.display_name, 
      level: c.level, 
      score: c.score 
    })) || []
  };
}

export const getServerSideProps: GetServerSideProps<PaperDetailPageProps> = async (context) => {
  const { id } = context.params || {};
  if (!id || typeof id !== 'string') {
    return { props: { paper: null } };
  }

  try {
    const client = new OpenAlexClient();
    const work = await client.getWork(id);
    const paper = openAlexWorkToPaper(work);
    return { props: { paper } };
  } catch (e) {
    console.error('Failed to load paper', e);
    return { props: { paper: null } };
  }
};

export default function PaperDetailPage({ paper }: PaperDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'abstract' | 'citations' | 'chat' | 'collections'>('abstract');
  const [showChat, setShowChat] = useState(false);

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading paper…</p>
        </div>
      </div>
    );
  }

  const formatAuthors = (authors?: Array<{ name: string }>) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    return authors.map(a => a.name).join(', ');
  };

  return (
    <>
      <Head>
        <title>{paper.title || 'Research Paper'} - Research Paper Search</title>
        <meta name="description" content={paper.abstract?.substring(0, 160) || 'Research paper details'} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            </div>
            
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={paper.title.substring(0, 40)}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-16 bg-gray-100 min-h-screen flex flex-col items-center py-4 space-y-4">
            <div className="w-8 h-8 rounded-full bg-gray-300" />
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl mx-auto px-8 py-6">
            {/* Navigation */}
            <button 
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go Back
            </button>

            {/* Paper Metadata */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                {paper.doi && <p>DOI: {paper.doi}</p>}
                {paper.venue && <p>{paper.venue}</p>}
              </div>
            </div>

            {/* Paper Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {paper.title}
            </h1>

            {/* Authors and Year */}
            <p className="text-lg text-gray-700 mb-4">
              {formatAuthors(paper.authors)} {paper.year}
            </p>

            {/* Keywords/Tags */}
            {paper.concepts && paper.concepts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {paper.concepts.map((concept) => (
                  <span
                    key={concept.id}
                    className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                  >
                    {concept.name}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom Navigation Tabs */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('abstract')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'abstract'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Abstract
                </button>
                <button
                  onClick={() => setActiveTab('citations')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'citations'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Citations
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'chat'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chat with Paper
                </button>
                <button
                  onClick={() => setActiveTab('collections')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'collections'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Collections
                </button>
              </div>
              
              <div className="mt-6">
                {activeTab === 'abstract' && (
                  <div>
                    {paper.abstract ? (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <p className="text-gray-700 leading-relaxed text-base">
                          {paper.abstract}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No abstract available for this paper.</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'citations' && (
                  <div>
                    <CitationsList paperId={paper.paperId} />
                  </div>
                )}
                {activeTab === 'chat' && (
                  <div className="h-96">
                    <PaperChat paperId={paper.paperId} paperTitle={paper.title} />
                  </div>
                )}
                {activeTab === 'collections' && (
                  <div>
                    <CollectionsManager selectedPaper={paper} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            {/* Tools Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tools</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTab('collections')}
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-6 h-6 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="text-xs text-gray-600">Add to Collection</span>
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-6 h-6 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs text-gray-600">Chat with Paper</span>
                </button>
                <button 
                  onClick={() => setActiveTab('citations')}
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-6 h-6 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h6" />
                  </svg>
                  <span className="text-xs text-gray-600">View Citations</span>
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
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-6 h-6 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs text-gray-600">Download PDF</span>
                  </button>
                )}
              </div>
            </div>

            {/* Paper Processing Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Paper</h3>
              <div className="space-y-3">
                {paper.pdfUrl && (
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/process-pdf', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            paperId: paper.paperId,
                            pdfUrl: paper.pdfUrl,
                            title: paper.title,
                            authors: paper.authors,
                            abstract: paper.abstract
                          })
                        });
                        
                        const data = await response.json();
                        if (response.ok) {
                          alert('Paper processed successfully! You can now chat with it.');
                        } else {
                          alert('Error processing paper: ' + data.error);
                        }
                      } catch (error) {
                        alert('Error processing paper: ' + error);
                      }
                    }}
                    className="w-full flex items-center justify-center p-3 border border-blue-300 rounded-lg hover:bg-blue-50 text-blue-700"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Process PDF for AI Chat
                  </button>
                )}
                <p className="text-xs text-gray-500">
                  Process the PDF to enable AI chat functionality and add to vector database
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
