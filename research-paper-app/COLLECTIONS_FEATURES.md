# Collections and RAG Features

This document describes the new collections management and RAG (Retrieval-Augmented Generation) features added to the research paper application.

## Overview

The application now supports:
1. **Automatic RAG Processing**: Papers added to collections are automatically processed for AI chat
2. **Collection Management**: Create, view, and manage collections of research papers with persistent storage
3. **Collection Chat**: Chat with entire collections using AI
4. **Navigation**: Easy navigation between search, collections, and paper details
5. **Supabase Integration**: Persistent storage of collections and papers in Supabase database

## Features

### 1. Automatic RAG Processing

When a paper is added to a collection:
- The system automatically downloads and processes the PDF (if available)
- Extracts text content and generates embeddings using Google Gemini AI
- Stores the processed data in the vector store for AI chat functionality
- Processing happens in the background without blocking the UI
- Papers are also stored in Supabase for persistence

### 2. Collection Management with Supabase

#### Creating Collections
- Navigate to the Collections page (`/collections`)
- Click "New Collection" to create a collection
- Provide a name and optional description
- Collections are stored in Supabase for persistence across sessions

#### Adding Papers to Collections
- From search results: Use the "Add to Collection" button on paper cards
- From paper detail pages: Use the Collections tab in the right sidebar
- Papers are automatically processed for RAG when added
- Papers are stored in both Supabase and the vector store

#### Managing Collections
- View all collections on the Collections page
- Delete collections (with confirmation)
- Remove individual papers from collections
- See collection statistics (number of papers, creation date)
- All changes are persisted in Supabase

### 3. Collection Chat

#### Chatting with Collections
- Select a collection on the Collections page
- Switch to the "Chat" tab
- Ask questions about:
  - Individual papers in the collection
  - Relationships between papers
  - Themes and patterns across the collection
  - Comparisons between papers
  - Specific findings or methodologies

#### Chat Features
- Real-time AI responses using Google Gemini
- Conversation history maintained during the session
- Clear chat functionality
- Error handling for unprocessed papers

### 4. Navigation

#### Navigation Links
- **Home page**: "Collections" link in the header
- **Paper detail pages**: "Collections" link in the navigation bar
- **Collections page**: "Search Papers" link to return to search

#### Breadcrumb Navigation
- Easy navigation between different sections of the application
- Consistent UI patterns across all pages

## Technical Implementation

### API Endpoints

#### Collections Management
- `GET /api/collections` - Get all collections or a specific collection
- `POST /api/collections` - Create a new collection
- `PUT /api/collections?id={id}` - Update a collection (add/remove papers, update metadata)
- `DELETE /api/collections?id={id}` - Delete a collection

#### RAG Processing
- `POST /api/process-pdf` - Process a PDF for RAG (called automatically)
- `POST /api/chat-with-paper` - Chat with individual papers
- `POST /api/chat-with-collection` - Chat with collections

### Data Storage

#### Supabase Database
- **Collections table**: Stores collection metadata (id, name, description, timestamps)
- **Collection_papers junction table**: Links collections to papers
- **Papers table**: Stores paper metadata and embeddings
- **Search_cache table**: Caches search results for performance

#### Vector Store
- File-based storage for processed paper data
- Embeddings and full text content
- Metadata for each processed paper

### Components

#### CollectionsManager
- Manages collection creation and paper addition
- Handles collection deletion and paper removal
- Displays collection statistics
- Integrates with Supabase for persistence

#### PaperChat
- Enhanced to support both individual papers and collections
- Dynamic UI based on chat type
- Error handling and loading states

#### Collections Page
- Main interface for collection management
- Two-panel layout: collections list and collection details
- Tabbed interface for overview and chat

## Database Schema

### Collections Table
```sql
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Collection Papers Junction Table
```sql
CREATE TABLE collection_papers (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  paper_id TEXT REFERENCES papers(paper_id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (collection_id, paper_id)
);
```

### Papers Table
```sql
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
```

## Usage Workflow

### Typical User Journey

1. **Search for Papers**
   - Use the search interface to find relevant papers
   - Browse search results and read paper details

2. **Create Collections**
   - Navigate to Collections page
   - Create collections for different research topics or projects
   - Collections are automatically saved to Supabase

3. **Add Papers to Collections**
   - From search results or paper details, add papers to collections
   - Papers are automatically processed for RAG in the background
   - Papers are stored in both Supabase and vector store

4. **Chat with Collections**
   - Select a collection and switch to the Chat tab
   - Ask questions about the papers in the collection
   - Explore relationships and themes across papers

5. **Manage Collections**
   - Remove papers that are no longer relevant
   - Delete collections when projects are complete
   - Organize papers into logical groupings
   - All changes are persisted in Supabase

## Error Handling

### RAG Processing Errors
- Papers without PDFs are skipped (no error shown)
- Processing failures are logged but don't block collection operations
- Users can still add papers to collections even if RAG processing fails

### Chat Errors
- Clear error messages when papers aren't processed
- Graceful fallbacks when AI services are unavailable
- Helpful guidance for users on how to resolve issues

### Collection Management Errors
- Confirmation dialogs for destructive operations
- Validation of collection names and descriptions
- Duplicate paper prevention
- Supabase connection error handling

### Database Errors
- Automatic retry mechanisms for transient failures
- Clear error messages for database issues
- Fallback to local storage when Supabase is unavailable

## Environment Variables

Required environment variables for full functionality:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

## Future Enhancements

### Planned Features
- Advanced collection analytics and insights
- Collaborative collections (sharing between users)
- Export collections to various formats
- Advanced search within collections
- Collection templates and organization tools
- Real-time collaboration features

### Technical Improvements
- Background job queue for RAG processing
- Caching for collection data and chat responses
- Real-time updates for collection changes
- Advanced vector search capabilities
- Integration with external research databases
- Offline support with local storage sync
