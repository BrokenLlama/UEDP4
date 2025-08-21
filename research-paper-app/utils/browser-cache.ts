import type { Paper, SearchCacheEntry } from '@/types/paper';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
}

export class BrowserCache {
  private static readonly CACHE_KEY = 'semantic_scholar_cache';
  private static readonly CACHE_DURATION = 3600000; // 1 hour
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly MAX_ENTRIES = 1000;

  static get<T>(key: string): T | null {
    try {
      const cache = this.getCache();
      const item = cache[key] as CacheItem<T> | undefined;

      if (!item) return null;

      // Check if expired
      if (Date.now() > item.expiresAt) {
        this.delete(key);
        return null;
      }

      // Update access time for LRU
      item.timestamp = Date.now();
      this.setCache(cache);

      return item.data;
    } catch (error) {
      console.warn('Browser cache get error:', error);
      return null;
    }
  }

  static set<T>(key: string, data: T, duration?: number): void {
    try {
      const cache = this.getCache();
      const expiresAt = Date.now() + (duration || this.CACHE_DURATION);

      cache[key] = {
        data,
        timestamp: Date.now(),
        expiresAt
      };

      // Implement LRU eviction if cache is too large
      this.evictIfNeeded(cache);
      this.setCache(cache);
    } catch (error) {
      console.warn('Browser cache set error:', error);
    }
  }

  static delete(key: string): void {
    try {
      const cache = this.getCache();
      delete cache[key];
      this.setCache(cache);
    } catch (error) {
      console.warn('Browser cache delete error:', error);
    }
  }

  static clear(pattern?: string): void {
    try {
      if (!pattern) {
        localStorage.removeItem(this.CACHE_KEY);
        return;
      }

      const cache = this.getCache();
      const regex = new RegExp(pattern);
      
      Object.keys(cache).forEach(key => {
        if (regex.test(key)) {
          delete cache[key];
        }
      });

      this.setCache(cache);
    } catch (error) {
      console.warn('Browser cache clear error:', error);
    }
  }

  static invalidate(): void {
    try {
      const cache = this.getCache();
      const now = Date.now();
      let hasChanges = false;

      Object.keys(cache).forEach(key => {
        const item = cache[key] as CacheItem<any>;
        if (now > item.expiresAt) {
          delete cache[key];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.setCache(cache);
      }
    } catch (error) {
      console.warn('Browser cache invalidate error:', error);
    }
  }

  static getStats(): CacheStats {
    try {
      const cache = this.getCache();
      const entries = Object.values(cache) as CacheItem<any>[];
      const totalSize = JSON.stringify(cache).length;
      const validEntries = entries.filter(item => Date.now() <= item.expiresAt);

      return {
        totalEntries: validEntries.length,
        totalSize,
        hitRate: 0 // Would need to track hits/misses to calculate this
      };
    } catch (error) {
      return { totalEntries: 0, totalSize: 0, hitRate: 0 };
    }
  }

  // Paper-specific cache methods
  static getPaper(paperId: string): Paper | null {
    return this.get<Paper>(`paper_${paperId}`);
  }

  static setPaper(paper: Paper): void {
    this.set<Paper>(`paper_${paper.paperId}`, paper);
  }

  static getSearchResult(queryHash: string): SearchCacheEntry | null {
    return this.get<SearchCacheEntry>(`search_${queryHash}`);
  }

  static setSearchResult(queryHash: string, result: SearchCacheEntry): void {
    this.set<SearchCacheEntry>(`search_${queryHash}`, result);
  }

  private static getCache(): Record<string, CacheItem<any>> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return {};
      }
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.warn('Failed to get cache from localStorage:', error);
      return {};
    }
  }

  private static setCache(cache: Record<string, CacheItem<any>>): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to set cache to localStorage:', error);
    }
  }

  private static evictIfNeeded(cache: Record<string, CacheItem<any>>): void {
    const entries = Object.entries(cache);
    const totalSize = JSON.stringify(cache).length;

    // If cache is too large or has too many entries, evict oldest
    if (totalSize > this.MAX_CACHE_SIZE || entries.length > this.MAX_ENTRIES) {
      // Sort by timestamp (oldest first)
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

      // Remove oldest entries until we're under limits
      const toRemove = entries.slice(0, Math.floor(entries.length * 0.2)); // Remove 20%
      
      toRemove.forEach(([key]) => {
        delete cache[key];
      });
    }
  }
}
