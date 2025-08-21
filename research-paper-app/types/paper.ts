export interface AuthorSummary {
  authorId: string;
  name: string;
}

export interface Citation {
  paperId: string;
  title: string;
  authors?: AuthorSummary[];
  year?: number;
  venue?: string;
  url?: string;
  doi?: string;
}

export interface Paper {
  paperId: string;
  title: string;
  abstract?: string | null;
  year?: number | null;
  venue?: string | null;
  citationCount?: number | null;
  url?: string | null;
  doi?: string | null;
  authors?: AuthorSummary[];
  embedding?: number[];
  isOpenAccess?: boolean;
  pdfUrl?: string | null;
  type?: string | null;
  concepts?: Array<{
    id: string;
    name: string;
    level: number;
    score: number;
  }>;
  citations?: Citation[];
  fullText?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  papers: Paper[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  paperId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
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

