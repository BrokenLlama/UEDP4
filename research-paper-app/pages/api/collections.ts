import type { NextApiRequest, NextApiResponse } from 'next';
import type { Collection } from '@/types/paper';

// In-memory storage for collections (in production, use a database)
let collections: Collection[] = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return handleGetCollections(req, res);
    case 'POST':
      return handleCreateCollection(req, res);
    case 'PUT':
      return handleUpdateCollection(req, res);
    case 'DELETE':
      return handleDeleteCollection(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetCollections(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (id) {
    const collection = collections.find(c => c.id === id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    return res.status(200).json({ success: true, data: collection });
  }

  return res.status(200).json({ success: true, data: collections });
}

async function handleCreateCollection(req: NextApiRequest, res: NextApiResponse) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Collection name is required' });
  }

  const newCollection: Collection = {
    id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: description || '',
    papers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  collections.push(newCollection);

  return res.status(201).json({ success: true, data: newCollection });
}

async function handleUpdateCollection(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { name, description, papers } = req.body;

  const collectionIndex = collections.findIndex(c => c.id === id);
  if (collectionIndex === -1) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  const updatedCollection: Collection = {
    ...collections[collectionIndex],
    name: name || collections[collectionIndex].name,
    description: description !== undefined ? description : collections[collectionIndex].description,
    papers: papers || collections[collectionIndex].papers,
    updatedAt: new Date().toISOString()
  };

  collections[collectionIndex] = updatedCollection;

  return res.status(200).json({ success: true, data: updatedCollection });
}

async function handleDeleteCollection(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const collectionIndex = collections.findIndex(c => c.id === id);
  if (collectionIndex === -1) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  collections.splice(collectionIndex, 1);

  return res.status(200).json({ success: true, message: 'Collection deleted successfully' });
}
