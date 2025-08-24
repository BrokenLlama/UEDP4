import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the DocumentEditor to avoid SSR issues
const DocumentEditor = dynamic(() => import('@/components/DocumentEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="ml-3 text-gray-600">Loading editor...</p>
    </div>
  ),
});

export default function EditorDemoPage() {
  const handleSave = (content: string) => {
    console.log('Document saved:', content);
    // In a real app, you'd save to a database
  };

  const handleContentChange = (content: string) => {
    console.log('Content changed:', content);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Editor Demo</h1>
              <p className="text-gray-600">A comprehensive rich text editor with Microsoft Word-like functionality</p>
            </div>
            <Link 
              href="/"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Back to Search
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <DocumentEditor
            initialContent={`
              <h1>Welcome to the Document Editor</h1>
              <p>This is a comprehensive rich text editor built with <strong>Tiptap</strong> and <strong>Next.js</strong>. It includes all the features you'd expect from a professional document editor:</p>
              
              <h2>Key Features</h2>
              <ul>
                <li>Font family and size selection</li>
                <li>Text formatting (bold, italic, underline, strikethrough)</li>
                <li>Text alignment and line height</li>
                <li>Headings (H1-H6)</li>
                <li>Lists (bullet, numbered, task lists)</li>
                <li>Tables with resizable columns</li>
                <li>Links and code blocks</li>
                <li>Blockquotes and horizontal rules</li>
                <li>Find & Replace functionality</li>
                <li>Auto-save to localStorage</li>
                <li>Word/character count</li>
                <li>Full-screen mode</li>
                <li>Keyboard shortcuts</li>
              </ul>
              
              <h2>Try It Out</h2>
              <p>Start typing below to experience the full range of formatting options available in the toolbar above.</p>
              
              <blockquote>
                <p>This editor provides a professional writing experience similar to Microsoft Word or Google Docs.</p>
              </blockquote>
              
              <h3>Keyboard Shortcuts</h3>
              <ul>
                <li><strong>Ctrl+S</strong> - Save document</li>
                <li><strong>Ctrl+F</strong> - Find & Replace</li>
                <li><strong>F11</strong> - Toggle full-screen</li>
                <li><strong>Ctrl+B</strong> - Bold</li>
                <li><strong>Ctrl+I</strong> - Italic</li>
                <li><strong>Ctrl+U</strong> - Underline</li>
              </ul>
            `}
            onSave={handleSave}
            onContentChange={handleContentChange}
            autoSave={true}
            autoSaveInterval={30000}
            showToolbar={true}
            showStats={true}
            showFindReplace={true}
            showExport={true}
            showFullScreen={true}
          />
        </div>
      </div>
    </div>
  );
}
