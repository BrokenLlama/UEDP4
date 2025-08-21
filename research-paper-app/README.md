# Research Paper Management System

A Next.js application with intelligent caching and rate limit handling for research paper search using Semantic Scholar API.

## Features

- 🔍 **Intelligent Search**: Multi-level caching system for fast paper discovery
- ⚡ **Rate Limit Handling**: Graceful handling of API rate limits with 1-second delays
- 🧠 **AI Integration**: Google Gemini AI for embeddings and insights
- 💾 **Multi-Level Caching**: Browser localStorage + Supabase cache table
- 🎨 **Modern UI**: Clean, responsive design with dark/light mode
- 📊 **Cache Analytics**: Real-time cache hit rates and performance metrics
- 🔄 **Smart Retry**: Automatic retry mechanisms for failed requests

## Tech Stack

- **Frontend & Backend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Research Papers**: Semantic Scholar API
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **Caching**: Browser localStorage + Supabase cache table

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd research-paper-app
npm install
```

### 2. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Supabase Setup

#### Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Papers table
CREATE TABLE papers (
  paper_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT,
  year INTEGER,
  venue TEXT,
  citation_count INTEGER,
  url TEXT,
  doi TEXT,
  authors JSONB,
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search cache table
CREATE TABLE search_cache (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  total_requested INTEGER NOT NULL,
  successful_count INTEGER NOT NULL,
  rate_limited_count INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Collections table
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection papers junction table
CREATE TABLE collection_papers (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  paper_id TEXT REFERENCES papers(paper_id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (collection_id, paper_id)
);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_papers(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  paper_id TEXT,
  title TEXT,
  abstract TEXT,
  year INTEGER,
  venue TEXT,
  citation_count INTEGER,
  url TEXT,
  doi TEXT,
  authors JSONB,
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.paper_id,
    p.title,
    p.abstract,
    p.year,
    p.venue,
    p.citation_count,
    p.url,
    p.doi,
    p.authors,
    p.embedding,
    p.created_at,
    p.updated_at,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM papers p
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_papers_year ON papers(year);
CREATE INDEX idx_papers_venue ON papers(venue);
CREATE INDEX idx_papers_citation_count ON papers(citation_count);
CREATE INDEX idx_search_cache_expires_at ON search_cache(expires_at);
CREATE INDEX idx_papers_embedding ON papers USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security (RLS)
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_papers ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth requirements)
CREATE POLICY "Allow public read access to papers" ON papers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to search cache" ON search_cache FOR SELECT USING (true);
CREATE POLICY "Allow public insert to search cache" ON search_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update search cache" ON search_cache FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from search cache" ON search_cache FOR DELETE USING (true);
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### POST /api/search-papers

Search for research papers with intelligent caching.

**Request Body:**
```json
{
  "query": "machine learning",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": [...],
    "rateLimited": 0,
    "fromCache": [...],
    "totalRequested": 10
  },
  "cacheInfo": {
    "fromCache": false,
    "cacheHitRate": 0.3,
    "rateLimited": false
  }
}
```

## Caching Strategy

### Multi-Level Cache Architecture

1. **Browser Cache (localStorage)**
   - Fastest access (immediate)
   - LRU eviction with 50MB limit
   - 1-hour expiration by default

2. **Supabase Cache Table**
   - Persistent across sessions
   - Query hash-based storage
   - Automatic expiration cleanup

3. **Semantic Scholar API**
   - Rate-limited (1-second delays)
   - Fallback for uncached data
   - Partial success handling

### Cache Invalidation

- Time-based expiration (1 hour default)
- Manual refresh options
- Smart cache warming for popular queries

## Rate Limit Handling

The system implements intelligent rate limit handling:

- **1-second delays** between Semantic Scholar API calls
- **Partial success handling** - cache successful results even if some fail
- **Graceful degradation** - return cached results when rate limited
- **Retry mechanisms** with exponential backoff
- **Real-time feedback** in UI about rate limit status

## Performance Optimizations

- Lazy loading for large result sets
- Debounced search input
- Progressive cache warming
- Efficient vector similarity search
- Optimistic UI updates for cached results

## Development

### Project Structure

```
research-paper-app/
├── components/          # React components
│   ├── SearchInterface.tsx
│   ├── PaperCard.tsx
│   └── CacheStatus.tsx
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   └── index.tsx      # Main page
├── lib/               # Core libraries
│   ├── supabase.ts    # Supabase client
│   ├── semantic-scholar-cache.ts
│   └── gemini-ai.ts   # AI integration
├── utils/             # Utilities
│   └── browser-cache.ts
├── types/             # TypeScript types
│   └── paper.ts
└── styles/            # Global styles
    └── globals.css
```

### Key Components

- **SemanticScholarCache**: Main caching logic with rate limit handling
- **BrowserCache**: localStorage-based caching with LRU eviction
- **SearchInterface**: Main search UI with real-time feedback
- **PaperCard**: Individual paper display component
- **CacheStatus**: Cache performance indicators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the [Issues](../../issues) page
- Review the documentation above
- Contact the maintainers

---

Built with ❤️ using Next.js, Supabase, and Semantic Scholar API
