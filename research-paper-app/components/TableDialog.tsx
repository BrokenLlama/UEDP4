'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { FiX, FiTable } from 'react-icons/fi';
import type { TableInsertOptions } from '@/types/editor';

interface TableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  options: TableInsertOptions;
  onInsert: (options: TableInsertOptions) => void;
}

export function TableDialog({
  isOpen,
  onClose,
  editor,
  options,
  onInsert,
}: TableDialogProps) {
  const [rows, setRows] = useState(options.rows);
  const [columns, setColumns] = useState(options.columns);
  const [withHeaderRow, setWithHeaderRow] = useState(options.withHeaderRow);

  const handleInsert = () => {
    editor.chain().focus().insertTable({
      rows,
      cols: columns,
      withHeaderRow,
    }).run();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-80 max-w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Insert Table</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rows
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Columns
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={withHeaderRow}
              onChange={(e) => setWithHeaderRow(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include header row</span>
          </label>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleInsert}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <FiTable className="w-4 h-4" />
              <span>Insert Table</span>
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
