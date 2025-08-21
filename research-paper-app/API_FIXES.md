# Semantic Scholar API Fixes

This document outlines the fixes implemented to resolve 500 Internal Server Error issues with the Semantic Scholar API integration.

## Problems Fixed

### 1. Invalid Year Parameter
**Issue**: `year=10` was being sent as an invalid parameter
**Fix**: 
- Added year validation in `transformSemanticScholarPaper()` function
- Year must be between 1900 and current year + 1
- Invalid years are filtered out and set to `undefined`

### 2. Too Many Fields Requested
**Issue**: Requesting all available fields caused server timeouts
**Fix**:
- Defined `VALID_FIELDS` array with essential fields only:
  - `paperId`, `title`, `authors`, `year`, `abstract`, `citationCount`, `url`, `venue`, `publicationDate`
- Reduced field requests to prevent server overload

### 3. High Limit Parameter
**Issue**: `limit=100` hit server capacity limits
**Fix**:
- Reduced maximum limit to 25 (`Math.min(limit, 25)`)
- Added proper validation in API endpoint
- Implemented safe defaults

### 4. Missing Error Handling
**Issue**: No proper retry logic for 500 errors
**Fix**:
- Implemented exponential backoff retry mechanism
- Added comprehensive error classification
- Created proper error response formatting

## Files Modified

### 1. `lib/semantic-scholar-cache.ts`
- Added retry logic with exponential backoff
- Implemented proper rate limiting
- Fixed year parameter validation
- Reduced API request limits
- Added comprehensive error handling

### 2. `pages/api/search-papers.ts`
- Added input validation using utility functions
- Implemented proper error response formatting
- Added retry logic wrapper
- Improved error classification and handling

### 3. `utils/api-utils.ts` (New)
- Created comprehensive validation functions
- Implemented retry logic with exponential backoff
- Added error classification utilities
- Created rate limiting utility class
- Added response formatting functions

## Key Features Added

### Retry Logic
```typescript
// Exponential backoff retry with 3 attempts
const result = await retryWithBackoff(
  () => SemanticScholarCache.searchWithCaching(query, safeLimit),
  3, // max retries
  1000 // base delay (1s, 2s, 4s)
);
```

### Input Validation
```typescript
// Validate search query
validateSearchQuery(query);

// Validate and sanitize limit
const safeLimit = validateLimit(limit);
```

### Rate Limiting
```typescript
// 1-second delay between requests
private static rateLimiter = new RateLimiter(1000);
await this.rateLimiter.waitForNextRequest();
```

### Error Classification
- **Rate Limit Errors**: 429 status codes
- **Retryable Errors**: 500, 502, 503, 504, network timeouts
- **Validation Errors**: Invalid input parameters
- **Service Errors**: API unavailable or technical issues

## Testing

### Manual Testing
1. Start the development server: `npm run dev`
2. Run the test script: `node test-api.js`
3. Test with the query "transformer" to verify it works
4. Test validation with invalid inputs

### Test Cases
- ✅ Valid search query ("transformer")
- ✅ Empty query (should be rejected)
- ✅ Query too long (should be rejected)
- ✅ Invalid limit values (should be rejected)
- ✅ Invalid characters in query (should be rejected)

## Error Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* search results */ },
  "cacheInfo": {
    "fromCache": false,
    "cacheHitRate": 0.5,
    "rateLimited": false,
    "successfulCount": 10,
    "totalRequested": 20
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "The API is temporarily unavailable due to high request volume.",
  "retryAfter": 60,
  "status": 429,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting Strategy

1. **1-second delay** between all API requests
2. **Exponential backoff** for retries (1s, 2s, 4s)
3. **Maximum 3 retry attempts** for failed requests
4. **Proper error handling** for rate limit responses

## Caching Strategy

1. **Browser Cache**: Fastest access for repeated queries
2. **Supabase Cache**: Persistent storage for search results
3. **Paper Cache**: Individual paper data caching
4. **Cache expiration**: 1 hour for search results

## Monitoring and Logging

- Console logging for all API calls
- Error logging with detailed information
- Retry attempt logging with backoff delays
- Cache hit/miss statistics

## Future Improvements

1. **Circuit Breaker Pattern**: Prevent cascading failures
2. **Request Queuing**: Handle high traffic periods
3. **Metrics Collection**: Track API performance
4. **Fallback Sources**: Alternative paper databases
5. **Caching TTL**: Configurable cache expiration times

## Environment Variables

Ensure these environment variables are set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Dependencies

The fixes require these packages:
- `semanticscholarjs`: Semantic Scholar API client
- `crypto-js`: Hash generation for cache keys
- `@supabase/supabase-js`: Database caching

All fixes maintain backward compatibility and existing functionality while significantly improving reliability and error handling.
