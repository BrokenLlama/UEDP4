export interface AuthorSummary {
  authorId: string;
  name: string;
}

export interface Paper {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  venue?: string;
  citationCount?: number;
  url?: string;
  doi?: string;
  authors?: AuthorSummary[];
  embedding?: number[];
  isOpenAccess?: boolean;
  pdfUrl?: string;
  type?: string;
  concepts?: Array<{
    id: string;
    name: string;
    level: number;
    score: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CacheResult {
  successful: Paper[];
  rateLimited: number;
  fromCache: Paper[];
  totalRequested: number;
}

export interface SearchCacheEntry {
  id: string; // queryHash
  query: string;
  results: Paper[];
  totalRequested: number;
  successfulCount: number;
  rateLimitedCount: number;
  updatedAt: string;
  expiresAt: string;
}

