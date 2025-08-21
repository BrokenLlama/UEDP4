// OpenAlex API Client - Replacement for Semantic Scholar
// Better rate limits (100,000 requests/day), no API key required, 250M+ works

import type { Filters } from '@/types/filters';

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  display_name: string;
  publication_year?: number;
  publication_date?: string;
  type: string;
  cited_by_count: number;
  biblio?: {
    volume?: string;
    issue?: string;
    first_page?: string;
    last_page?: string;
  };
  is_retracted: boolean;
  is_paratext: boolean;
  primary_location?: {
    source?: {
      id: string;
      display_name: string;
      type: string;
    };
    landing_page_url?: string;
    pdf_url?: string;
  };
  open_access: {
    is_oa: boolean;
    oa_date?: string;
    oa_url?: string;
  };
  authorships: Array<{
    author_position: string;
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions?: Array<{
      id: string;
      display_name: string;
      country_code?: string;
    }>;
  }>;
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: Array<{
    id: string;
    display_name: string;
    level: number;
    score: number;
  }>;
}

export interface OpenAlexResponse {
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
  };
  results: OpenAlexWork[];
}

export interface OpenAlexSearchOptions {
  limit?: number;
  page?: number;
  sort?: string;
  filters?: Record<string, string>;
  email?: string;
}

export class OpenAlexClient {
  private baseURL = 'https://api.openalex.org';
  private email: string;

  constructor(email?: string) {
    // Use provided email or default to a placeholder
    this.email = email || 'research-paper-app@example.com';
  }

  async searchWorks(query: string, options: OpenAlexSearchOptions = {}): Promise<OpenAlexResponse> {
    const params = new URLSearchParams({
      search: query,
      per_page: (options.limit || 25).toString(),
      page: (options.page || 1).toString(),
      sort: options.sort || 'relevance_score:desc',
    });

    // Add filters if provided
    if (options.filters) {
      params.append('filter', this.buildFilterString(options.filters));
    }

    const url = `${this.baseURL}/works?${params.toString()}`;
    console.log('Making OpenAlex request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Research-Paper-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAlex response:', {
      count: data.meta?.count,
      results: data.results?.length,
      responseTime: data.meta?.db_response_time_ms
    });

    return data;
  }

  // New method to search with filters
  async searchWorksWithFilters(query: string, filters: Filters, options: OpenAlexSearchOptions = {}): Promise<OpenAlexResponse> {
    const openAlexFilters = this.convertFiltersToOpenAlex(filters);
    
    return this.searchWorks(query, {
      ...options,
      filters: openAlexFilters,
      sort: filters.sortBy
    });
  }

  // Convert our filter interface to OpenAlex filter format
  convertFiltersToOpenAlex(filters: Filters): Record<string, string> {
    const openAlexFilters: Record<string, string> = {};

    // Year range
    if (filters.yearMin && filters.yearMax) {
      openAlexFilters['publication_year'] = `${filters.yearMin}-${filters.yearMax}`;
    }

    // Publication types
    if (filters.types.length > 0) {
      openAlexFilters['type'] = filters.types.join('|');
    }

    // Open access
    if (filters.openAccess) {
      openAlexFilters['is_oa'] = 'true';
    }

    // Citation count
    if (filters.minCitations > 0) {
      openAlexFilters['cited_by_count'] = `>${filters.minCitations}`;
    }

    // Research topics (using concepts)
    if (filters.topics.length > 0) {
      // For topics, we'll use the concept IDs
      const topicFilters = filters.topics.map(topic => `concepts.id:${topic}`).join(',');
      openAlexFilters['concepts'] = topicFilters;
    }

    return openAlexFilters;
  }

  buildFilterString(filters: Record<string, string>): string {
    return Object.entries(filters)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
  }

  // Transform OpenAlex results to your app's Paper format
  transformResults(openAlexData: OpenAlexResponse): any[] {
    return openAlexData.results.map(work => ({
      paperId: work.id.split('/').pop() || work.id, // Extract ID from URL
      title: work.display_name,
      abstract: this.reconstructAbstract(work.abstract_inverted_index),
      year: work.publication_year,
      venue: work.primary_location?.source?.display_name,
      citationCount: work.cited_by_count,
      url: work.primary_location?.landing_page_url || work.open_access.oa_url,
      doi: work.doi,
      authors: work.authorships.map(authorship => ({
        authorId: authorship.author.id.split('/').pop() || authorship.author.id,
        name: authorship.author.display_name
      })),
      isOpenAccess: work.open_access.is_oa,
      pdfUrl: work.open_access.oa_url,
      type: work.type,
      concepts: work.concepts?.map(concept => ({
        id: concept.id,
        name: concept.display_name,
        level: concept.level,
        score: concept.score
      })) || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  reconstructAbstract(invertedIndex?: Record<string, number[]>): string | null {
    if (!invertedIndex) return null;
    
    const words: string[] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      positions.forEach(pos => {
        words[pos] = word;
      });
    }
    return words.join(' ');
  }

  // Get a single work by ID
  async getWork(workId: string): Promise<OpenAlexWork> {
    const url = `${this.baseURL}/works/${workId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Research-Paper-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Search with common filters
  async searchRecentPapers(query: string, limit: number = 10): Promise<OpenAlexResponse> {
    return this.searchWorks(query, {
      limit,
      filters: {
        'publication_year': '2020-2024',
        'type': 'article'
      },
      sort: 'cited_by_count:desc'
    });
  }

  async searchOpenAccessPapers(query: string, limit: number = 10): Promise<OpenAlexResponse> {
    return this.searchWorks(query, {
      limit,
      filters: {
        'is_oa': 'true'
      },
      sort: 'cited_by_count:desc'
    });
  }

  async searchHighlyCitedPapers(query: string, limit: number = 10): Promise<OpenAlexResponse> {
    return this.searchWorks(query, {
      limit,
      filters: {
        'cited_by_count': '>100'
      },
      sort: 'cited_by_count:desc'
    });
  }

  // Get citations for a specific work
  async getCitations(workId: string, limit: number = 50): Promise<OpenAlexWork[]> {
    const url = `${this.baseURL}/works/${workId}/cited_by?per_page=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Research-Paper-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  // Get references for a specific work
  async getReferences(workId: string, limit: number = 50): Promise<OpenAlexWork[]> {
    const url = `${this.baseURL}/works/${workId}/references?per_page=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Research-Paper-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }
}
