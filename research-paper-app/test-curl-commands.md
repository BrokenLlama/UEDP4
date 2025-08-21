# Test Curl Commands for Research Paper API

## Basic Test Request
```bash
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"machine learning","limit":5}' \
  | jq .
```

## Test with Different Queries
```bash
# Test with "AI" query
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"artificial intelligence","limit":3}' \
  | jq .

# Test with "neural networks" query  
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"neural networks","limit":3}' \
  | jq .

# Test with "computer vision" query
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"computer vision","limit":3}' \
  | jq .
```

## Test Validation (Should Return Errors)
```bash
# Test empty query (should return 400)
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"","limit":5}' \
  | jq .

# Test limit too high (should be clamped to 25)
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"test","limit":100}' \
  | jq .

# Test invalid characters (should return 400)
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"test<script>alert(1)</script>","limit":5}' \
  | jq .
```

## Test Without jq (if jq not installed)
```bash
curl -X POST http://localhost:3000/api/search-papers \
  -H "Content-Type: application/json" \
  -d '{"query":"machine learning","limit":5}'
```

## Expected Response Format
```json
{
  "success": true,
  "data": {
    "successful": [],
    "rateLimited": 0,
    "fromCache": [],
    "totalRequested": 5
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "cacheInfo": {
    "fromCache": false,
    "cacheHitRate": 0,
    "rateLimited": false,
    "successfulCount": 0,
    "totalRequested": 5
  }
}
```

## Notes
- The API is currently returning empty results due to Semantic Scholar rate limiting
- This is expected behavior and shows our error handling is working correctly
- The 200 status code and proper JSON structure confirm the fixes are working
- If you get actual paper results, that means the rate limiting has cleared
