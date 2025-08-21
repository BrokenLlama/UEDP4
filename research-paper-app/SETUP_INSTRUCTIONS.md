# Research Paper App - New Features Setup

This document explains how to set up and use the new features added to the research paper application.

## New Features Added

1. **Citations Display** - View papers that cite the current paper
2. **ChromaDB Vector Database** - Store and search paper embeddings
3. **Google Generative AI Chat** - Chat with papers using Gemini AI
4. **Paper Collections** - Create and manage collections of papers
5. **PDF Download & Processing** - Download PDFs and extract text for AI processing

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the `research-paper-app` directory with the following variables:

```env
# Google AI API Key for Gemini
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### 2. Install Dependencies

The following packages have been added:
- `@google/generative-ai` - Google's Generative AI SDK
- `pdf-parse` - PDF text extraction
- `axios` - HTTP client for PDF downloads

### 3. Vector Store Setup

The application now uses a simple file-based vector store that doesn't require any external setup. Data is stored in the `data/vector-store.json` file.

### 4. Google AI API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env.local` file

**Note**: The Google AI API key is required for:
- AI chat functionality with papers
- Generating embeddings for vector search
- Paper summarization and insights

Without the API key, these features will show appropriate error messages.

## How to Use the New Features

### 1. Viewing Citations

1. Search for a paper
2. Click on the paper title to view details
3. Click the "Citations" tab to see papers that cite this work

### 2. Chatting with Papers

1. Go to a paper's detail page
2. Click "Process PDF for AI Chat" in the right sidebar (if PDF is available)
3. Wait for processing to complete
4. Click the "Chat with Paper" tab
5. Start asking questions about the paper

### 3. Creating Collections

1. Go to a paper's detail page
2. Click the "Collections" tab
3. Click "New Collection" to create a collection
4. Add papers to collections using the "Add Paper" button

### 4. Downloading PDFs

1. On any paper card or detail page
2. Click the "Download PDF" button (if PDF is available)
3. The PDF will be downloaded to your device

### 5. Processing PDFs for AI

1. Go to a paper's detail page
2. Click "Process PDF for AI Chat" in the right sidebar
3. This will:
   - Download the PDF
   - Extract text content
   - Generate embeddings using Google AI
   - Store in ChromaDB vector database
   - Enable chat functionality

## API Endpoints

### New API Endpoints Created:

- `POST /api/paper-citations` - Get citations for a paper
- `POST /api/process-pdf` - Process PDF and add to vector database
- `POST /api/chat-with-paper` - Chat with a paper using AI
- `GET/POST/PUT/DELETE /api/collections` - Manage paper collections
- `POST /api/download-pdf` - Download PDF files

## File Structure

### New Components:
- `components/CitationsList.tsx` - Display citations
- `components/PaperChat.tsx` - Chat interface for papers
- `components/CollectionsManager.tsx` - Manage paper collections

### New Libraries:
- `lib/vector-store.ts` - File-based vector store
- `lib/gemini-ai.ts` - Google AI client (updated)
- `lib/pdf-processor.ts` - PDF processing utilities

### New Types:
- Updated `types/paper.ts` with new interfaces for citations, collections, and chat

## Troubleshooting

### Common Issues:

1. **Vector Store Error**
   - Ensure the `data` directory is writable
   - Check if the `data/vector-store.json` file is corrupted

2. **Google AI API Error**
   - Verify your API key is correct
   - Check API key permissions and quotas

3. **PDF Processing Fails**
   - Ensure the PDF URL is accessible
   - Check if the PDF is publicly available

4. **Chat Not Working**
   - Make sure the paper has been processed first
   - Check if the paper exists in the vector store

## Development Notes

- Collections are currently stored in memory (will be lost on server restart)
- For production, consider using a database like Supabase or PostgreSQL
- PDF processing can be slow for large files
- Consider implementing rate limiting for API calls
- Add error handling for network issues and API failures
