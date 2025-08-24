import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Collection, Paper } from '@/types/paper';
import { CollectionsManager } from '@/components/CollectionsManager';
import { PaperChat } from '@/components/PaperChat';
import CollectionBubbleGraph from '@/components/CollectionBubbleGraph';

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'graph'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/collections');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch collections');
      }

      setCollections(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setActiveTab('overview');
  };

  const handlePaperClick = (paper: Paper) => {
    router.push(`/paper/${paper.paperId}`);
  };

  const handleRemovePaper = async (collectionId: string, paperId: string) => {
    try {
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) return;

      const updatedPapers = collection.papers.filter(p => p.paperId !== paperId);

      const response = await fetch(`/api/collections?id=${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          papers: updatedPapers
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCollections(prev => prev.map(c => 
          c.id === collectionId ? data.data : c
        ));
        
        if (selectedCollection?.id === collectionId) {
          setSelectedCollection(data.data);
        }
      }
    } catch (error) {
      console.error('Error removing paper from collection:', error);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const response = await fetch(`/api/collections?id=${collectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCollections(prev => prev.filter(c => c.id !== collectionId));
        if (selectedCollection?.id === collectionId) {
          setSelectedCollection(null);
        }
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCollections}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Collections</h1>
              <p className="text-gray-600">Manage and interact with your research paper collections</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/editor-demo"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Document
              </Link>
              <Link 
                href="/"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Papers
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Collections List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
                <CollectionsManager onPaperAdded={() => fetchCollections()} />
              </div>

              {collections.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No collections yet</p>
                  <p className="text-sm text-gray-400">Create your first collection to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedCollection?.id === collection.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => handleCollectionSelect(collection)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {collection.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {collection.papers.length} paper{collection.papers.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(collection.id);
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Collection Details */}
          <div className="lg:col-span-2">
            {selectedCollection ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Collection Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedCollection.name}</h2>
                      {selectedCollection.description && (
                        <p className="text-gray-600 mt-1">{selectedCollection.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedCollection.papers.length} paper{selectedCollection.papers.length !== 1 ? 's' : ''} • 
                        Created {new Date(selectedCollection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === 'overview'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === 'chat'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => setActiveTab('graph')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === 'graph'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Graph
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' ? (
                    <div>
                      {selectedCollection.papers.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-2 text-gray-500">No papers in this collection</p>
                          <p className="text-sm text-gray-400">Add papers from search results or paper details</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedCollection.papers.map((paper) => (
                            <div
                              key={paper.paperId}
                              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 
                                    className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                    onClick={() => handlePaperClick(paper)}
                                  >
                                    {paper.title}
                                  </h3>
                                  {paper.authors && paper.authors.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {paper.authors.map(a => a.name).join(', ')}
                                    </p>
                                  )}
                                  {paper.abstract && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                      {paper.abstract}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                    {paper.year && <span>{paper.year}</span>}
                                    {paper.venue && <span>{paper.venue}</span>}
                                    {paper.citationCount && (
                                      <span>{paper.citationCount} citations</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemovePaper(selectedCollection.id, paper.paperId)}
                                  className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'chat' ? (
                    <div>
                      <PaperChat 
                        collectionId={selectedCollection.id}
                        collectionName={selectedCollection.name}
                        paperCount={selectedCollection.papers.length}
                      />
                    </div>
                                     ) : (
                    <div>
                      <CollectionBubbleGraph 
                        papers={selectedCollection.papers}
                        onNodeClick={(paper) => {
                          // Don't navigate automatically - let the bubble graph handle the click
                          console.log('Paper clicked in graph:', paper.title);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Collection</h3>
                <p className="mt-2 text-gray-500">
                  Choose a collection from the list to view its papers and chat with it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
