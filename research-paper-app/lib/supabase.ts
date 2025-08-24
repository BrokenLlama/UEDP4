import { createClient } from '@supabase/supabase-js';
import type { Paper, SearchCacheEntry, Collection } from '@/types/paper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey
  });
  throw new Error('Missing required Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey // Fallback to anon key if service key not available
);

// Cache management functions
export async function getCachedSearch(queryHash: string): Promise<SearchCacheEntry | null> {
  const { data, error } = await supabase
    .from('search_cache')
    .select('*')
    .eq('id', queryHash)
    .single();

  if (error || !data) return null;

  // Check if cache is expired
  if (new Date(data.expires_at) < new Date()) {
    await deleteCachedSearch(queryHash);
    return null;
  }

  return {
    id: data.id,
    query: data.query,
    results: data.results,
    totalRequested: data.total_requested,
    successfulCount: data.successful_count,
    rateLimitedCount: data.rate_limited_count,
    updatedAt: data.updated_at,
    expiresAt: data.expires_at
  };
}

export async function cacheSearchResult(entry: Omit<SearchCacheEntry, 'id'> & { id: string }): Promise<void> {
  await supabase.from('search_cache').upsert({
    id: entry.id,
    query: entry.query,
    results: entry.results,
    total_requested: entry.totalRequested,
    successful_count: entry.successfulCount,
    rate_limited_count: entry.rateLimitedCount,
    updated_at: entry.updatedAt,
    expires_at: entry.expiresAt
  });
}

export async function deleteCachedSearch(queryHash: string): Promise<void> {
  await supabase.from('search_cache').delete().eq('id', queryHash);
}

// Paper management functions
export async function cachePaper(paper: Paper): Promise<void> {
  await supabase.from('papers').upsert({
    paper_id: paper.paperId,
    title: paper.title,
    abstract: paper.abstract,
    year: paper.year,
    venue: paper.venue,
    citation_count: paper.citationCount,
    url: paper.url,
    doi: paper.doi,
    authors: paper.authors,
    embedding: paper.embedding,
    created_at: paper.createdAt || new Date().toISOString(),
    updated_at: paper.updatedAt || new Date().toISOString()
  });
}

export async function getPaper(paperId: string): Promise<Paper | null> {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('paper_id', paperId)
    .single();

  if (error || !data) return null;

  return {
    paperId: data.paper_id,
    title: data.title,
    abstract: data.abstract,
    year: data.year,
    venue: data.venue,
    citationCount: data.citation_count,
    url: data.url,
    doi: data.doi,
    authors: data.authors,
    embedding: data.embedding,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// Vector search functions
export async function searchSimilarPapers(embedding: number[], limit: number = 10): Promise<Paper[]> {
  const { data, error } = await supabase.rpc('match_papers', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit
  });

  if (error || !data) return [];

  return data.map((item: any) => ({
    paperId: item.paper_id,
    title: item.title,
    abstract: item.abstract,
    year: item.year,
    venue: item.venue,
    citationCount: item.citation_count,
    url: item.url,
    doi: item.doi,
    authors: item.authors,
    embedding: item.embedding,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
}

// Collection management functions
export async function createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      name: collection.name,
      description: collection.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    throw new Error('Failed to create collection');
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    papers: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function getCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_papers (
        paper_id,
        papers (
          paper_id,
          title,
          abstract,
          year,
          venue,
          citation_count,
          url,
          doi,
          authors,
          embedding,
          created_at,
          updated_at
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collections:', error);
    return [];
  }

  return data.map((collection: any) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    papers: collection.collection_papers?.map((cp: any) => ({
      paperId: cp.papers.paper_id,
      title: cp.papers.title,
      abstract: cp.papers.abstract,
      year: cp.papers.year,
      venue: cp.papers.venue,
      citationCount: cp.papers.citation_count,
      url: cp.papers.url,
      doi: cp.papers.doi,
      authors: cp.papers.authors,
      embedding: cp.papers.embedding,
      createdAt: cp.papers.created_at,
      updatedAt: cp.papers.updated_at
    })) || [],
    createdAt: collection.created_at,
    updatedAt: collection.updated_at
  }));
}

export async function getCollection(collectionId: string): Promise<Collection | null> {
  try {
    console.log(`Fetching collection ${collectionId} from Supabase...`);
    
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_papers (
          paper_id,
          papers (
            paper_id,
            title,
            abstract,
            year,
            venue,
            citation_count,
            url,
            doi,
            authors,
            embedding,
            created_at,
            updated_at
          )
        )
      `)
      .eq('id', collectionId)
      .single();

    if (error) {
      console.error('Supabase error fetching collection:', error);
      return null;
    }

    if (!data) {
      console.log(`No collection found with ID: ${collectionId}`);
      return null;
    }

    console.log(`Successfully fetched collection: ${data.name}`);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      papers: data.collection_papers?.map((cp: any) => ({
        paperId: cp.papers.paper_id,
        title: cp.papers.title,
        abstract: cp.papers.abstract,
        year: cp.papers.year,
        venue: cp.papers.venue,
        citationCount: cp.papers.citation_count,
        url: cp.papers.url,
        doi: cp.papers.doi,
        authors: cp.papers.authors,
        embedding: cp.papers.embedding,
        createdAt: cp.papers.created_at,
        updatedAt: cp.papers.updated_at
      })) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getCollection:', error);
    return null;
  }
}

export async function updateCollection(collectionId: string, updates: Partial<Collection>): Promise<Collection | null> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;

  const { data, error } = await supabase
    .from('collections')
    .update(updateData)
    .eq('id', collectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating collection:', error);
    return null;
  }

  return getCollection(collectionId);
}

export async function deleteCollection(collectionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId);

  if (error) {
    console.error('Error deleting collection:', error);
    return false;
  }

  return true;
}

export async function addPaperToCollection(collectionId: string, paper: Paper): Promise<boolean> {
  // First, ensure the paper exists in the papers table
  await cachePaper(paper);

  // Then add the paper to the collection
  const { error } = await supabase
    .from('collection_papers')
    .insert({
      collection_id: collectionId,
      paper_id: paper.paperId,
      added_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error adding paper to collection:', error);
    return false;
  }

  // Update collection's updated_at timestamp
  await supabase
    .from('collections')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', collectionId);

  return true;
}

export async function removePaperFromCollection(collectionId: string, paperId: string): Promise<boolean> {
  const { error } = await supabase
    .from('collection_papers')
    .delete()
    .eq('collection_id', collectionId)
    .eq('paper_id', paperId);

  if (error) {
    console.error('Error removing paper from collection:', error);
    return false;
  }

  // Update collection's updated_at timestamp
  await supabase
    .from('collections')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', collectionId);

  return true;
}
