'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { FiX, FiLink } from 'react-icons/fi';
import type { LinkDialogState } from '@/types/editor';

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  state: LinkDialogState;
  onStateChange: (state: LinkDialogState) => void;
}

export function LinkDialog({
  isOpen,
  onClose,
  editor,
  state,
  onStateChange,
}: LinkDialogProps) {
  const [url, setUrl] = useState(state.url);
  const [text, setText] = useState(state.text);
  const [isNewTab, setIsNewTab] = useState(state.isNewTab);

  useEffect(() => {
    setUrl(state.url);
    setText(state.text);
    setIsNewTab(state.isNewTab);
  }, [state]);

  const handleInsert = () => {
    if (!url.trim()) return;

    const linkText = text.trim() || url;
    
    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').setLink({ 
        href: url,
        target: isNewTab ? '_blank' : undefined,
        rel: isNewTab ? 'noopener noreferrer' : undefined,
      }).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${url}" ${isNewTab ? 'target="_blank" rel="noopener noreferrer"' : ''}>${linkText}</a>`).run();
    }

    onStateChange({
      ...state,
      isOpen: false,
      url: '',
      text: '',
      isNewTab: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Insert Link</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Text (optional)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Display text"
            />
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isNewTab}
              onChange={(e) => setIsNewTab(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Open in new tab</span>
          </label>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleInsert}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <FiLink className="w-4 h-4" />
              <span>Insert Link</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
