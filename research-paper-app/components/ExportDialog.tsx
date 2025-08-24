'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { FiX, FiDownload, FiPrinter } from 'react-icons/fi';
import type { ExportOptions } from '@/types/editor';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  options: ExportOptions;
  onExport: (options: ExportOptions) => void;
}

export function ExportDialog({
  isOpen,
  onClose,
  editor,
  options,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState(options.format);
  const [includeStyles, setIncludeStyles] = useState(options.includeStyles);

  const handleExport = () => {
    const content = editor.getHTML();
    
    switch (format) {
      case 'html':
        if (includeStyles) {
          const htmlWithStyles = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Exported Document</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2rem; }
                h1, h2, h3, h4, h5, h6 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
                p { margin-bottom: 1rem; }
                ul, ol { margin-bottom: 1rem; padding-left: 2rem; }
                blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin: 1rem 0; }
                code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
                pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
                table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
                th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
                th { background: #f4f4f4; }
              </style>
            </head>
            <body>
              ${content}
            </body>
            </html>
          `;
          downloadFile(htmlWithStyles, 'document.html', 'text/html');
        } else {
          downloadFile(content, 'document.html', 'text/html');
        }
        break;
      
      case 'text':
        const textContent = editor.getText();
        downloadFile(textContent, 'document.txt', 'text/plain');
        break;
      
      case 'print':
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Print Document</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2rem; }
                h1, h2, h3, h4, h5, h6 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
                p { margin-bottom: 1rem; }
                ul, ol { margin-bottom: 1rem; padding-left: 2rem; }
                blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin: 1rem 0; }
                code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
                pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
                table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
                th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
                th { background: #f4f4f4; }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        break;
    }
    
    onClose();
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Export Document</h3>
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
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="html"
                  checked={format === 'html'}
                  onChange={(e) => setFormat(e.target.value as 'html')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">HTML Document</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="text"
                  checked={format === 'text'}
                  onChange={(e) => setFormat(e.target.value as 'text')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Plain Text</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="print"
                  checked={format === 'print'}
                  onChange={(e) => setFormat(e.target.value as 'print')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Print</span>
              </label>
            </div>
          </div>

          {format === 'html' && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeStyles}
                onChange={(e) => setIncludeStyles(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include CSS styles</span>
            </label>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              {format === 'print' ? <FiPrinter className="w-4 h-4" /> : <FiDownload className="w-4 h-4" />}
              <span>{format === 'print' ? 'Print' : 'Export'}</span>
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
