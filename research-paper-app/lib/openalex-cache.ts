import CryptoJS from 'crypto-js';
import { BrowserCache } from '@/utils/browser-cache';
import { getCachedSearch, cacheSearchResult, cachePaper, getPaper } from '@/lib/supabase';
import { OpenAlexClient } from '@/lib/openalex-client';
import { RateLimiter, retryWithBackoff, isRateLimitError, isRetryableError } from '@/utils/api-utils';
import type { Paper, CacheResult, SearchCacheEntry } from '@/types/paper';

export class OpenAlexCache {
  private static client = new OpenAlexClient();
  private static rateLimiter = new RateLimiter(500); // 500ms delay between requests (OpenAlex is more generous)

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
      
      // Make API call with retry logic
      const apiResults = await retryWithBackoff(
        async () => {
          try {
            // Use OpenAlex search with better parameters
            const response = await this.client.searchWorks(query, {
              limit: safeLimit,
              sort: 'cited_by_count:desc'
            });
            
            console.log('OpenAlex search results:', {
              total: response.meta.count,
              returned: response.results.length,
              responseTime: response.meta.db_response_time_ms
            });
            
            return response;
          } catch (error) {
            console.error('OpenAlex API error:', error);
            throw error;
          }
        },
        3, // max retries
        1000 // base delay
      );
      
      // Transform OpenAlex results to our Paper format
      const papers = this.client.transformResults(apiResults);
      
      // Process each result with individual rate limit handling
      for (const paper of papers) {
        try {
          // Skip papers without paperId
          if (!paper.paperId) {
            console.warn('Paper without paperId, skipping');
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

          // Add the new paper
          results.push(paper);
          
          // Cache the paper
          await cachePaper(paper);
          BrowserCache.setPaper(paper);

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
      
      const work = await retryWithBackoff(
        () => this.client.getWork(paperId),
        3, // max retries
        1000 // base delay
      );
      
      const processedPaper = this.client.transformResults({ meta: {} as any, results: [work] })[0];
      
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

  // Specialized search methods
  static async searchRecentPapers(query: string, limit: number = 10): Promise<CacheResult> {
    const queryHash = this.generateQueryHash(`${query}_recent`, limit);
    
    // Check cache first
    const browserCache = BrowserCache.getSearchResult(queryHash);
    if (browserCache) {
      return {
        successful: browserCache.results,
        rateLimited: browserCache.rateLimitedCount,
        fromCache: browserCache.results,
        totalRequested: browserCache.totalRequested
      };
    }

    try {
      await this.rateLimiter.waitForNextRequest();
      
      const apiResults = await retryWithBackoff(
        () => this.client.searchRecentPapers(query, limit),
        3,
        1000
      );
      
      const papers = this.client.transformResults(apiResults);
      
      // Cache the results
      const searchResult: SearchCacheEntry = {
        id: queryHash,
        query: `${query} (recent)`,
        results: papers,
        totalRequested: limit,
        successfulCount: papers.length,
        rateLimitedCount: 0,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      await cacheSearchResult(searchResult);
      BrowserCache.setSearchResult(queryHash, searchResult);

      return {
        successful: papers,
        rateLimited: 0,
        fromCache: [],
        totalRequested: limit
      };
    } catch (error) {
      console.error('Error in searchRecentPapers:', error);
      return {
        successful: [],
        rateLimited: limit,
        fromCache: [],
        totalRequested: limit
      };
    }
  }

  static async searchOpenAccessPapers(query: string, limit: number = 10): Promise<CacheResult> {
    const queryHash = this.generateQueryHash(`${query}_oa`, limit);
    
    // Check cache first
    const browserCache = BrowserCache.getSearchResult(queryHash);
    if (browserCache) {
      return {
        successful: browserCache.results,
        rateLimited: browserCache.rateLimitedCount,
        fromCache: browserCache.results,
        totalRequested: browserCache.totalRequested
      };
    }

    try {
      await this.rateLimiter.waitForNextRequest();
      
      const apiResults = await retryWithBackoff(
        () => this.client.searchOpenAccessPapers(query, limit),
        3,
        1000
      );
      
      const papers = this.client.transformResults(apiResults);
      
      // Cache the results
      const searchResult: SearchCacheEntry = {
        id: queryHash,
        query: `${query} (open access)`,
        results: papers,
        totalRequested: limit,
        successfulCount: papers.length,
        rateLimitedCount: 0,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      await cacheSearchResult(searchResult);
      BrowserCache.setSearchResult(queryHash, searchResult);

      return {
        successful: papers,
        rateLimited: 0,
        fromCache: [],
        totalRequested: limit
      };
    } catch (error) {
      console.error('Error in searchOpenAccessPapers:', error);
      return {
        successful: [],
        rateLimited: limit,
        fromCache: [],
        totalRequested: limit
      };
    }
  }
}
