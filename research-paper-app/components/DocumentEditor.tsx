'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { LineHeight } from '@/lib/editor/extensions/line-height';
import { EditorToolbar } from './EditorToolbar';
import { EditorStats } from './EditorStats';
import { FindReplaceDialog } from './FindReplaceDialog';
import { LinkDialog } from './LinkDialog';
import { TableDialog } from './TableDialog';
import { ExportDialog } from './ExportDialog';
import type { 
  DocumentEditorProps, 
  EditorState, 
  DocumentStats, 
  FindReplaceState,
  LinkDialogState,
  TableInsertOptions,
  ExportOptions 
} from '@/types/editor';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiList,
  FiHash,
  FiLink,
  FiTable,
  FiCode,
  FiMinus,
  FiCheckSquare,
  FiSave,
  FiSearch,
  FiDownload,
  FiMaximize,
  FiMinimize,
  FiX
} from 'react-icons/fi';

const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial', family: 'Arial, sans-serif' },
  { value: 'Times New Roman', label: 'Times New Roman', family: 'Times New Roman, serif' },
  { value: 'Helvetica', label: 'Helvetica', family: 'Helvetica, sans-serif' },
  { value: 'Georgia', label: 'Georgia', family: 'Georgia, serif' },
  { value: 'Verdana', label: 'Verdana', family: 'Verdana, sans-serif' },
  { value: 'Courier New', label: 'Courier New', family: 'Courier New, monospace' },
];

const FONT_SIZES = [
  { value: '8px', label: '8' },
  { value: '9px', label: '9' },
  { value: '10px', label: '10' },
  { value: '11px', label: '11' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '30px', label: '30' },
  { value: '36px', label: '36' },
  { value: '48px', label: '48' },
  { value: '60px', label: '60' },
  { value: '72px', label: '72' },
];

const LINE_HEIGHTS = [
  { value: '1.0', label: '1.0' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2.0', label: '2.0' },
  { value: '2.5', label: '2.5' },
  { value: '3.0', label: '3.0' },
];

const HEADINGS = [
  { value: 1, label: 'Heading 1' },
  { value: 2, label: 'Heading 2' },
  { value: 3, label: 'Heading 3' },
  { value: 4, label: 'Heading 4' },
  { value: 5, label: 'Heading 5' },
  { value: 6, label: 'Heading 6' },
];

export default function DocumentEditor({
  initialContent = '',
  placeholder = 'Start writing your document...',
  autoSave = true,
  autoSaveInterval = 30000,
  onSave,
  onContentChange,
  className = '',
  readOnly = false,
  showToolbar = true,
  showStats = true,
  showFindReplace = true,
  showExport = true,
  showFullScreen = true,
}: DocumentEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [findReplace, setFindReplace] = useState<FindReplaceState>({
    isOpen: false,
    findText: '',
    replaceText: '',
    isCaseSensitive: false,
    isRegex: false,
    currentMatch: 0,
    totalMatches: 0,
  });
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({
    isOpen: false,
    url: '',
    text: '',
    isNewTab: true,
  });
  const [tableDialog, setTableDialog] = useState<TableInsertOptions | null>(null);
  const [exportDialog, setExportDialog] = useState<ExportOptions | null>(null);
  const [stats, setStats] = useState<DocumentStats>({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    paragraphs: 0,
    sentences: 0,
  });
  const [selectedCollection, setSelectedCollection] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [collections, setCollections] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextStyle,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      LineHeight.configure({
        types: ['paragraph', 'heading'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 p-4 rounded font-mono text-sm',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-gray-300 pl-4 italic',
        },
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'border-t border-gray-300 my-4',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      Strike,
      Subscript,
      Superscript,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false, // Fix SSR hydration issue
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange?.(html);
      updateStats(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-6',
      },
    },
  });

  const updateStats = useCallback((editor: any) => {
    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const paragraphs = editor.state.doc.content.content.filter((node: any) => node.type.name === 'paragraph').length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;

    setStats({
      words,
      characters,
      charactersNoSpaces,
      paragraphs,
      sentences,
    });
  }, []);

  const handleSave = useCallback(() => {
    if (editor) {
      const content = editor.getHTML();
      const documentData = {
        content,
        title: documentTitle,
        folder: selectedFolder,
        lastModified: new Date().toISOString(),
      };
      
      onSave?.(content);
      
      // Enhanced auto-save to localStorage with metadata
      if (autoSave && isClient) {
        localStorage.setItem('document-editor-content', JSON.stringify(documentData));
        console.log('Document saved to browser cache:', documentData);
      } else {
        console.log('Auto-save conditions not met:', { autoSave, isClient });
      }
    }
  }, [editor, onSave, autoSave, documentTitle, selectedFolder, isClient]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !editor) return;

    const interval = setInterval(handleSave, autoSaveInterval);
    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, handleSave, editor]);

  // Save on content change
  useEffect(() => {
    if (!editor || !autoSave) return;

    const handleContentChange = () => {
      // Debounce the save to avoid too frequent saves
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 2000); // Save 2 seconds after last change

      return () => clearTimeout(timeoutId);
    };

    editor.on('update', handleContentChange);
    return () => {
      editor.off('update', handleContentChange);
    };
  }, [editor, autoSave, handleSave]);

  // Load from localStorage on mount
  useEffect(() => {
    console.log('Load effect triggered:', { autoSave, initialContent, isClient, hasEditor: !!editor });
    if (autoSave && !initialContent && isClient) {
      const saved = localStorage.getItem('document-editor-content');
      console.log('Saved content from localStorage:', saved);
      if (saved && editor) {
        try {
          const documentData = JSON.parse(saved);
          editor.commands.setContent(documentData.content);
          setDocumentTitle(documentData.title || 'Untitled Document');
          setSelectedFolder(documentData.folder || '');
          console.log('Document loaded from browser cache:', documentData);
        } catch (error) {
          console.log('Error parsing saved data, using fallback:', error);
          // Fallback for old format
          editor.commands.setContent(saved);
        }
      }
    }
  }, [autoSave, initialContent, editor, isClient]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;

      // Save: Ctrl/Cmd + S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }

      // Find: Ctrl/Cmd + F
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setFindReplace(prev => ({ ...prev, isOpen: true }));
      }

      // Full screen: F11
      if (event.key === 'F11') {
        event.preventDefault();
        setIsFullScreen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleSave]);

  // Chat with collection
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedCollection || isChatLoading) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsChatLoading(true);

    // Add user message to chat history
    const newChatHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(newChatHistory);

    try {
      console.log('Sending chat request:', { collectionId: selectedCollection, message: userMessage });
      const response = await fetch('/api/chat-with-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: selectedCollection,
          message: userMessage,
        }),
      });

      console.log('Chat API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chat API response data:', data);
        const aiResponse = data.data?.response || data.response || 'No response received';
        setChatHistory([...newChatHistory, { role: 'assistant' as const, content: aiResponse }]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Chat API error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setChatHistory([...newChatHistory, { 
        role: 'assistant' as const, 
        content: `Sorry, I encountered an error: ${errorMessage}` 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Fetch collections on mount
  useEffect(() => {
    if (!isClient) return;
    
    const fetchCollections = async () => {
      setIsLoadingCollections(true);
      try {
        const response = await fetch('/api/collections');
        console.log('Collections API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Collections API data:', data);
          setCollections(data.data || []);
        } else {
          console.error('Failed to fetch collections:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setIsLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [isClient]);

  // Don't render until we're on the client side
  if (!isClient) {
    return <div className="flex items-center justify-center p-8">Loading editor...</div>;
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Initializing editor...</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className} ${
      isFullScreen ? 'fixed inset-0 z-50' : ''
    }`}>
      <div className="flex h-full">
        {/* Main Editor Section */}
        <div className="flex-1 flex flex-col">
      {/* Header with all buttons on one line */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          {/* Folder Selection */}
          <div className="relative">
            <select 
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Folder</option>
              <option value="research">Research Papers</option>
              <option value="notes">Notes</option>
              <option value="drafts">Drafts</option>
              <option value="final">Final Documents</option>
            </select>
          </div>
          
          {/* Document Title */}
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="Document Title"
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
          />
        </div>

        {/* Center: All functionality buttons */}
        <div className="flex items-center space-x-2">
          {showStats && <EditorStats stats={stats} />}
          {showFindReplace && (
            <button
              onClick={() => setFindReplace(prev => ({ ...prev, isOpen: true }))}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Find & Replace (Ctrl+F)"
            >
              <FiSearch className="w-4 h-4" />
            </button>
          )}
          {showExport && (
            <button
              onClick={() => setExportDialog({ format: 'html', includeStyles: true })}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Export"
            >
              <FiDownload className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSave}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title="Save (Ctrl+S)"
          >
            <FiSave className="w-4 h-4" />
          </button>
          {showFullScreen && (
            <button
              onClick={() => setIsFullScreen(prev => !prev)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen (F11)'}
            >
              {isFullScreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
            </button>
          )}
          {isFullScreen && (
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Close"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        </div>

        {/* Toolbar */}
        {showToolbar && (
          <EditorToolbar
            editor={editor}
            fontFamilies={FONT_FAMILIES}
            fontSizes={FONT_SIZES}
            lineHeights={LINE_HEIGHTS}
            headings={HEADINGS}
            onLinkClick={() => setLinkDialog(prev => ({ ...prev, isOpen: true }))}
            onTableClick={() => setTableDialog({ rows: 3, columns: 3, withHeaderRow: true })}
          />
        )}

        {/* Editor Content */}
        <div className="relative flex-1">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Chat Section */}
        <div className="w-80 border-l border-gray-200 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Collection Chat</h3>
            <select 
              value={selectedCollection}
              onChange={(e) => {
                console.log('Collection selected:', e.target.value);
                setSelectedCollection(e.target.value);
              }}
              disabled={isLoadingCollections}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">
                {isLoadingCollections ? 'Loading collections...' : 'Select Collection'}
              </option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                {collections.length === 0 
                  ? 'No collections available. Create a collection first!'
                  : 'Select a collection and start chatting!'
                }
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={collections.length === 0 ? "No collections available" : "Ask about your collection..."}
                disabled={!selectedCollection || isChatLoading || collections.length === 0}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button
                type="submit"
                disabled={!selectedCollection || !chatMessage.trim() || isChatLoading || collections.length === 0}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <FindReplaceDialog
        isOpen={findReplace.isOpen}
        onClose={() => setFindReplace(prev => ({ ...prev, isOpen: false }))}
        editor={editor}
        state={findReplace}
        onStateChange={setFindReplace}
      />

      <LinkDialog
        isOpen={linkDialog.isOpen}
        onClose={() => setLinkDialog(prev => ({ ...prev, isOpen: false }))}
        editor={editor}
        state={linkDialog}
        onStateChange={setLinkDialog}
      />

      {tableDialog && (
        <TableDialog
          isOpen={true}
          onClose={() => setTableDialog(null)}
          editor={editor}
          options={tableDialog}
          onInsert={(options) => {
            editor.commands.insertTable(options);
            setTableDialog(null);
          }}
        />
      )}

      {exportDialog && (
        <ExportDialog
          isOpen={true}
          onClose={() => setExportDialog(null)}
          editor={editor}
          options={exportDialog}
          onExport={(options) => {
            // Handle export logic
            setExportDialog(null);
          }}
        />
      )}
    </div>
  );
}
