# Direct Semantic Scholar API Curl Commands

## Basic Search Request
```bash
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search?query=machine%20learning&limit=5&fields=paperId,title,authors,year,abstract,citationCount,url,venue"
```

## URL Encoded Version (easier to read)
```bash
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=machine learning" \
  -d "limit=5" \
  -d "fields=paperId,title,authors,year,abstract,citationCount,url,venue"
```

## Test Different Queries
```bash
# Test with "transformer"
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=transformer" \
  -d "limit=3" \
  -d "fields=paperId,title,authors,year,abstract,citationCount,url,venue"

# Test with "artificial intelligence"
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=artificial intelligence" \
  -d "limit=3" \
  -d "fields=paperId,title,authors,year,abstract,citationCount,url,venue"

# Test with "neural networks"
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=neural networks" \
  -d "limit=3" \
  -d "fields=paperId,title,authors,year,abstract,citationCount,url,venue"
```

## With API Key (if you have one)
```bash
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=machine learning" \
  -d "limit=5" \
  -d "fields=paperId,title,authors,year,abstract,citationCount,url,venue" \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

## Minimal Fields (faster response)
```bash
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=machine learning" \
  -d "limit=3" \
  -d "fields=paperId,title,authors,year"
```

## Test with Year Filter
```bash
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=machine learning" \
  -d "year=2020-2024" \
  -d "limit=3" \
  -d "fields=paperId,title,authors,year,abstract"
```

## Test with Venue Filter
```bash
curl -X GET "https://api.semanticscholar.org/graph/v1/paper/search" \
  -G \
  -d "query=machine learning" \
  -d "venue=NeurIPS" \
  -d "limit=3" \
  -d "fields=paperId,title,authors,year,venue"
```

## Expected Response Format
```json
{
  "total": 1234567,
  "offset": 0,
  "next": 3,
  "data": [
    {
      "paperId": "649def34f8be52c8b66281af98ae884c09aef38b",
      "title": "Example Paper Title",
      "authors": [
        {
          "authorId": "123456",
          "name": "John Doe"
        }
      ],
      "year": 2023,
      "abstract": "This is the paper abstract...",
      "citationCount": 42,
      "url": "https://example.com/paper",
      "venue": "Conference Name"
    }
  ]
}
```

## Rate Limiting Note
- Without an API key: 100 requests per 5 minutes
- With an API key: 1000 requests per 5 minutes
- If you get a 429 error, wait a few minutes and try again

## Get API Key
To get higher rate limits, apply for an API key at:
https://www.semanticscholar.org/product/api#api-key-form
