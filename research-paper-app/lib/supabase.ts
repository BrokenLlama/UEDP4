import { createClient } from '@supabase/supabase-js';
import type { Paper, SearchCacheEntry } from '@/types/paper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
