import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAlexCache } from '@/lib/openalex-cache';
import { OpenAlexClient } from '@/lib/openalex-client';
import { 
  validateSearchQuery, 
  validateLimit, 
  formatAPIResponse, 
  formatAPIError,
  retryWithBackoff 
} from '../../utils/api-utils';
import type { CacheResult } from '@/types/paper';
import type { Filters } from '@/types/filters';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit, filters } = req.body;

    // Validate input parameters
    validateSearchQuery(query);
    const safeLimit = validateLimit(limit);

    console.log(`Searching for: "${query}" with limit: ${safeLimit}`, { filters });

    let result: CacheResult;

    // If filters are provided, use the new filtered search
    if (filters) {
      const client = new OpenAlexClient();
      const openAlexResponse = await retryWithBackoff(
        () => client.searchWorksWithFilters(query, filters, { limit: safeLimit }),
        3, // max retries
        1000 // base delay
      );

      const transformedResults = client.transformResults(openAlexResponse);
      
      result = {
        successful: transformedResults,
        rateLimited: 0,
        fromCache: [],
        totalRequested: transformedResults.length
      };
    } else {
      // Use the existing caching system for backward compatibility
      result = await retryWithBackoff(
        () => OpenAlexCache.searchWithCaching(query, safeLimit),
        3, // max retries
        1000 // base delay
      );
    }

    // Return the results with cache information
    const cacheInfo = {
      fromCache: result.fromCache.length > 0,
      cacheHitRate: result.totalRequested > 0 ? result.fromCache.length / result.totalRequested : 0,
      rateLimited: result.rateLimited > 0,
      successfulCount: result.successful.length,
      totalRequested: result.totalRequested
    };

    return res.status(200).json(formatAPIResponse(result, cacheInfo));

  } catch (error) {
    console.error('Search API error:', error);
    
    const errorResponse = formatAPIError(error, 'An unexpected error occurred while searching papers');
    
    return res.status(errorResponse.status || 500).json(errorResponse);
  }
}
