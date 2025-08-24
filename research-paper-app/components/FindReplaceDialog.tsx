'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { FiX, FiSearch, FiChevronUp, FiChevronDown, FiRefreshCw } from 'react-icons/fi';
import type { FindReplaceState } from '@/types/editor';

interface FindReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  state: FindReplaceState;
  onStateChange: (state: FindReplaceState) => void;
}

export function FindReplaceDialog({
  isOpen,
  onClose,
  editor,
  state,
  onStateChange,
}: FindReplaceDialogProps) {
  const [findText, setFindText] = useState(state.findText);
  const [replaceText, setReplaceText] = useState(state.replaceText);
  const [isCaseSensitive, setIsCaseSensitive] = useState(state.isCaseSensitive);
  const [isRegex, setIsRegex] = useState(state.isRegex);

  useEffect(() => {
    setFindText(state.findText);
    setReplaceText(state.replaceText);
    setIsCaseSensitive(state.isCaseSensitive);
    setIsRegex(state.isRegex);
  }, [state]);

  const handleFind = () => {
    if (!findText.trim()) return;

    const options = {
      searchString: findText,
      caseSensitive: isCaseSensitive,
      regex: isRegex,
    };

    // Simple find implementation - in a real app you'd use a proper find extension
    const text = editor.getText();
    const regex = isRegex 
      ? new RegExp(findText, isCaseSensitive ? 'g' : 'gi')
      : new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), isCaseSensitive ? 'g' : 'gi');
    
    const matches = text.match(regex) || [];
    
    onStateChange({
      ...state,
      findText,
      isCaseSensitive,
      isRegex,
      totalMatches: matches.length,
      currentMatch: matches.length > 0 ? 1 : 0,
    });
  };

  const handleReplace = () => {
    if (!findText.trim()) return;

    const text = editor.getText();
    const regex = isRegex 
      ? new RegExp(findText, isCaseSensitive ? 'g' : 'gi')
      : new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), isCaseSensitive ? 'g' : 'gi');
    
    const newText = text.replace(regex, replaceText);
    editor.commands.setContent(newText);
    
    onStateChange({
      ...state,
      findText,
      replaceText,
      isCaseSensitive,
      isRegex,
      totalMatches: 0,
      currentMatch: 0,
    });
  };

  const handleReplaceAll = () => {
    handleReplace();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Find & Replace</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Find */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Find
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter text to find..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFind();
                  }
                }}
              />
              <button
                onClick={handleFind}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <FiSearch className="w-4 h-4" />
                <span>Find</span>
              </button>
            </div>
          </div>

          {/* Replace */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Replace with
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter replacement text..."
              />
                             <button
                 onClick={handleReplace}
                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
               >
                 <FiRefreshCw className="w-4 h-4" />
                 <span>Replace</span>
               </button>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isCaseSensitive}
                onChange={(e) => setIsCaseSensitive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Case sensitive</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isRegex}
                onChange={(e) => setIsRegex(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Regex</span>
            </label>
          </div>

          {/* Results */}
          {state.totalMatches > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {state.currentMatch} of {state.totalMatches} matches
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Navigate to previous match
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    // Navigate to next match
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleReplaceAll}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Replace All
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
