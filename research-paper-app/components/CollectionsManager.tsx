import React, { useState, useEffect } from 'react';
import type { Collection, Paper } from '@/types/paper';

interface CollectionsManagerProps {
  selectedPaper?: Paper;
  onPaperAdded?: (collectionId: string, paper: Paper) => void;
}

export function CollectionsManager({ selectedPaper, onPaperAdded }: CollectionsManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create collection');
      }

      setCollections(prev => [...prev, data.data]);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const addPaperToCollection = async (collectionId: string, paper: Paper) => {
    if (!paper) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections?id=${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addPaper: paper
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add paper to collection');
      }

      setCollections(prev => prev.map(c => 
        c.id === collectionId ? data.data : c
      ));

      onPaperAdded?.(collectionId, paper);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add paper to collection');
    } finally {
      setLoading(false);
    }
  };

  const removePaperFromCollection = async (collectionId: string, paperId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections?id=${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removePaper: paperId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove paper from collection');
      }

      setCollections(prev => prev.map(c => 
        c.id === collectionId ? data.data : c
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove paper from collection');
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections?id=${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete collection');
      }

      setCollections(prev => prev.filter(c => c.id !== collectionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    } finally {
      setLoading(false);
    }
  };

  const formatAuthors = (authors?: Array<{ name: string }>) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length <= 2) return authors.map(a => a.name).join(', ');
    return `${authors.slice(0, 2).map(a => a.name).join(', ')} et al.`;
  };

  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading collections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Paper Collections</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'New Collection'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Create Collection Form */}
      {showCreateForm && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Create New Collection</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={createCollection}
                disabled={!newCollectionName.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div className="space-y-4">
        {collections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No collections yet</p>
            <p className="text-sm">Create a collection to organize your papers</p>
          </div>
        ) : (
          collections.map((collection) => (
            <div key={collection.id} className="border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{collection.name}</h4>
                    {collection.description && (
                      <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {collection.papers.length} paper{collection.papers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPaper && (
                      <button
                        onClick={() => addPaperToCollection(collection.id, selectedPaper)}
                        disabled={loading || collection.papers.some(p => p.paperId === selectedPaper.paperId)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {collection.papers.some(p => p.paperId === selectedPaper.paperId) ? 'Added' : 'Add Paper'}
                      </button>
                    )}
                    <button
                      onClick={() => deleteCollection(collection.id)}
                      className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Papers in Collection */}
              {collection.papers.length > 0 && (
                <div className="p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Papers in this collection:</h5>
                  <div className="space-y-2">
                    {collection.papers.map((paper) => (
                      <div key={paper.paperId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{paper.title}</p>
                          <p className="text-xs text-gray-600">{formatAuthors(paper.authors)}</p>
                        </div>
                        <button
                          onClick={() => removePaperFromCollection(collection.id, paper.paperId)}
                          className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
