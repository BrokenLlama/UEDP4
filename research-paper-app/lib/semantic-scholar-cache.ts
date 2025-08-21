import { SemanticScholar } from 'semanticscholarjs';
import CryptoJS from 'crypto-js';
import { BrowserCache } from '@/utils/browser-cache';
import { getCachedSearch, cacheSearchResult, cachePaper, getPaper } from '@/lib/supabase';
import { RateLimiter, retryWithBackoff, isRateLimitError, isRetryableError } from '@/utils/api-utils';
import type { Paper, CacheResult, SearchCacheEntry } from '@/types/paper';

export class SemanticScholarCache {
  private static sch = new SemanticScholar();
  private static rateLimiter = new RateLimiter(1000); // 1 second delay between requests

  // Valid fields for API requests to prevent server timeouts
  private static readonly VALID_FIELDS = [
    'paperId',
    'title',
    'authors',
    'year',
    'abstract',
    'citationCount',
    'url',
    'venue',
    'publicationDate'
  ];

  // Generate hash for cache key
  static generateQueryHash(query: string, limit: number): string {
    return CryptoJS.SHA256(`${query}_${limit}`).toString();
  }

  // Main search function with multi-level caching
  static async searchWithCaching(query: string, limit: number = 10): Promise<CacheResult> {
    const queryHash = this.generateQueryHash(query, limit);
    
    // 1. Check browser cache first (fastest)
    const browserCache = BrowserCache.getSearchResult(queryHash);
    if (browserCache) {
      return {
        successful: browserCache.results,
        rateLimited: browserCache.rateLimitedCount,
        fromCache: browserCache.results,
        totalRequested: browserCache.totalRequested
      };
    }

    // 2. Check Supabase cache
    const supabaseCache = await getCachedSearch(queryHash);
    if (supabaseCache) {
      // Cache in browser for faster future access
      BrowserCache.setSearchResult(queryHash, supabaseCache);
      return {
        successful: supabaseCache.results,
        rateLimited: supabaseCache.rateLimitedCount,
        fromCache: supabaseCache.results,
        totalRequested: supabaseCache.totalRequested
      };
    }

    // 3. Make API calls for missing papers
    return await this.fetchFromAPI(query, limit, queryHash);
  }

  private static async fetchFromAPI(query: string, limit: number, queryHash: string): Promise<CacheResult> {
    const results: Paper[] = [];
    let rateLimitedCount = 0;
    let fromCache: Paper[] = [];

    try {
      // Ensure rate limit compliance
      await this.rateLimiter.waitForNextRequest();

      // Use reduced limit to prevent server timeouts
      const safeLimit = Math.min(limit, 25);
      
      // Make API call with retry logic - use direct HTTP request
      const apiResults = await retryWithBackoff(
        async () => {
          try {
            // Use direct HTTP request with the working parameters from the curl command
            const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
            url.searchParams.set('query', query);
            url.searchParams.set('limit', safeLimit.toString());
            url.searchParams.set('fields', this.VALID_FIELDS.join(','));
            
            console.log('Making request to:', url.toString());
            
            const response = await fetch(url.toString(), {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Research-Paper-App/1.0'
              }
            });
            
            if (!response.ok) {
              if (response.status === 429) {
                throw new Error('Rate limit exceeded');
              }
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Raw API response:', data);
            return data;
          } catch (error) {
            console.error('Semantic Scholar API error:', error);
            // Check if it's a rate limit error
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Too Many Requests') || errorMessage.includes('Rate limit exceeded')) {
              throw new Error('Rate limit exceeded');
            }
            throw error;
          }
        },
        3, // max retries
        1000 // base delay
      );
      
      console.log('API Results type:', typeof apiResults);
      console.log('API Results data:', apiResults?.data);
      
      // Handle API response object (direct HTTP request format)
      let papers = [];
      if (apiResults && typeof apiResults === 'object') {
        if (Array.isArray(apiResults)) {
          papers = apiResults;
        } else if (apiResults.data && Array.isArray(apiResults.data)) {
          papers = apiResults.data;
        } else if (apiResults.items && Array.isArray(apiResults.items)) {
          papers = apiResults.items;
        }
      }
      
      // Ensure we have papers data
      if (!papers || papers.length === 0) {
        console.warn('No results returned from Semantic Scholar API');
        return {
          successful: [],
          rateLimited: 0,
          fromCache: [],
          totalRequested: limit
        };
      }
      
      // Process each result with individual rate limit handling
      for (const paper of papers) {
        try {
          // Skip papers without paperId or invalid papers
          if (!paper || !paper.paperId) {
            console.warn('Invalid paper data, skipping');
            continue;
          }

          // Check if paper is already cached
          const cachedPaper = await this.getOrFetchPaper(paper.paperId);
          if (cachedPaper) {
            results.push(cachedPaper);
            if (cachedPaper.createdAt) {
              fromCache.push(cachedPaper);
            }
            continue;
          }

          // Transform and cache new paper
          const processedPaper = this.transformSemanticScholarPaper(paper);
          results.push(processedPaper);
          
          // Cache the paper
          await cachePaper(processedPaper);
          BrowserCache.setPaper(processedPaper);

        } catch (error) {
          if (isRateLimitError(error)) {
            rateLimitedCount++;
            console.warn(`Rate limited for paper ${paper.paperId || 'unknown'}`);
          } else {
            console.error(`Error processing paper ${paper.paperId || 'unknown'}:`, error);
          }
        }
      }

      // Cache the search result
      const searchResult: SearchCacheEntry = {
        id: queryHash,
        query,
        results,
        totalRequested: limit,
        successfulCount: results.length,
        rateLimitedCount,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
      };

      await cacheSearchResult(searchResult);
      BrowserCache.setSearchResult(queryHash, searchResult);

    } catch (error) {
      if (isRateLimitError(error)) {
        rateLimitedCount = limit; // All requests failed due to rate limit
      } else {
        console.error('Error in fetchFromAPI:', error);
      }
    }

    return {
      successful: results,
      rateLimited: rateLimitedCount,
      fromCache,
      totalRequested: limit
    };
  }

  private static async getOrFetchPaper(paperId: string): Promise<Paper | null> {
    // Check browser cache first
    const browserPaper = BrowserCache.getPaper(paperId);
    if (browserPaper) return browserPaper;

    // Check Supabase cache
    const supabasePaper = await getPaper(paperId);
    if (supabasePaper) {
      BrowserCache.setPaper(supabasePaper);
      return supabasePaper;
    }

    // Fetch from API if not cached
    try {
      await this.rateLimiter.waitForNextRequest();
      
      const paper = await retryWithBackoff(
        () => this.sch.get_paper(paperId),
        3, // max retries
        1000 // base delay
      );
      
      const processedPaper = this.transformSemanticScholarPaper(paper);
      
      // Cache the paper
      await cachePaper(processedPaper);
      BrowserCache.setPaper(processedPaper);
      
      return processedPaper;
    } catch (error) {
      if (isRateLimitError(error)) {
        throw error; // Re-throw rate limit errors
      }
      console.error(`Error fetching paper ${paperId}:`, error);
      return null;
    }
  }

  private static transformSemanticScholarPaper(paper: any): Paper {
    // Validate and clean the year field
    let year: number | undefined;
    if (paper.year) {
      const yearNum = parseInt(paper.year.toString(), 10);
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear() + 1) {
        year = yearNum;
      }
    }

    return {
      paperId: paper.paperId,
      title: paper.title,
      abstract: paper.abstract,
      year,
      venue: paper.venue,
      citationCount: paper.citationCount,
      url: paper.url,
      doi: paper.doi,
      authors: paper.authors?.map((author: any) => ({
        authorId: author.authorId,
        name: author.name
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Utility methods for cache management
  static async clearCache(pattern?: string): Promise<void> {
    BrowserCache.clear(pattern);
    // Note: Supabase cache clearing would require admin privileges
  }

  static getCacheStats() {
    return BrowserCache.getStats();
  }

  // Batch search with intelligent caching
  static async batchSearch(queries: string[], limit: number = 10): Promise<CacheResult[]> {
    const results: CacheResult[] = [];
    
    for (const query of queries) {
      const result = await this.searchWithCaching(query, limit);
      results.push(result);
      
      // Add delay between batch requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }
}
