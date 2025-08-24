'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
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
  FiType,
  FiMinus as FiSubscript,
  FiPlus as FiSuperscript,
  FiCornerDownRight,
  FiCornerUpLeft,
  FiMessageSquare,
} from 'react-icons/fi';
import type { FontOption, FontSizeOption, LineHeightOption, HeadingOption } from '@/types/editor';

interface EditorToolbarProps {
  editor: Editor;
  fontFamilies: FontOption[];
  fontSizes: FontSizeOption[];
  lineHeights: LineHeightOption[];
  headings: HeadingOption[];
  onLinkClick: () => void;
  onTableClick: () => void;
}

export function EditorToolbar({
  editor,
  fontFamilies,
  fontSizes,
  lineHeights,
  headings,
  onLinkClick,
  onTableClick,
}: EditorToolbarProps) {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showLineHeightDropdown, setShowLineHeightDropdown] = useState(false);

  const getCurrentFontFamily = useCallback(() => {
    return fontFamilies.find(font => 
      editor.isActive('textStyle', { fontFamily: font.value })
    ) || fontFamilies[0];
  }, [editor, fontFamilies]);

  const getCurrentFontSize = useCallback(() => {
    return fontSizes.find(size => 
      editor.isActive('textStyle', { fontSize: size.value })
    ) || fontSizes[4]; // Default to 12px
  }, [editor, fontSizes]);

  const getCurrentHeading = useCallback(() => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) {
        return headings.find(h => h.value === i);
      }
    }
    return null;
  }, [editor, headings]);

  const getCurrentLineHeight = useCallback(() => {
    return lineHeights.find(height => 
      editor.isActive('paragraph', { lineHeight: height.value }) ||
      editor.isActive('heading', { lineHeight: height.value })
    ) || lineHeights[1]; // Default to 1.15
  }, [editor, lineHeights]);

  const ToolbarButton = ({ 
    icon: Icon, 
    label, 
    action, 
    isActive = false, 
    isDisabled = false,
    shortcut 
  }: {
    icon: React.ComponentType<any>;
    label: string;
    action: () => void;
    isActive?: boolean;
    isDisabled?: boolean;
    shortcut?: string;
  }) => (
    <button
      onClick={action}
      disabled={isDisabled}
      className={`p-2 rounded transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const DropdownButton = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    isActive = false 
  }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded border transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border-blue-200' 
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{value}</span>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Row 1: Font family, size, basic formatting */}
      <div className="flex items-center space-x-1 p-2 border-b border-gray-100">
        {/* Font Family */}
        <div className="relative">
          <DropdownButton
            icon={FiType}
            label="Font Family"
            value={getCurrentFontFamily().label}
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            isActive={showFontDropdown}
          />
          {showFontDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {fontFamilies.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(font.value).run();
                    setShowFontDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className="relative">
          <DropdownButton
            icon={FiType}
            label="Font Size"
            value={getCurrentFontSize().label}
            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
            isActive={showSizeDropdown}
          />
          {showSizeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-20 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    editor.chain().focus().setFontSize(size.value).run();
                    setShowSizeDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Basic Formatting */}
        <ToolbarButton
          icon={FiBold}
          label="Bold"
          action={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          shortcut="Ctrl+B"
        />
        <ToolbarButton
          icon={FiItalic}
          label="Italic"
          action={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          shortcut="Ctrl+I"
        />
        <ToolbarButton
          icon={FiUnderline}
          label="Underline"
          action={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          shortcut="Ctrl+U"
        />
        <ToolbarButton
          icon={FiSubscript}
          label="Subscript"
          action={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive('subscript')}
        />
        <ToolbarButton
          icon={FiSuperscript}
          label="Superscript"
          action={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive('superscript')}
        />
      </div>

      {/* Row 2: Alignment, lists, indent controls */}
      <div className="flex items-center space-x-1 p-2 border-b border-gray-100">
        {/* Text Alignment */}
        <ToolbarButton
          icon={FiAlignLeft}
          label="Align Left"
          action={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
        />
        <ToolbarButton
          icon={FiAlignCenter}
          label="Align Center"
          action={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
        />
        <ToolbarButton
          icon={FiAlignRight}
          label="Align Right"
          action={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
        />
        <ToolbarButton
          icon={FiAlignJustify}
          label="Justify"
          action={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
        />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Lists */}
        <ToolbarButton
          icon={FiList}
          label="Bullet List"
          action={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        />
        <ToolbarButton
          icon={FiList}
          label="Ordered List"
          action={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        />
        <ToolbarButton
          icon={FiCheckSquare}
          label="Task List"
          action={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
        />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Indent Controls */}
        <ToolbarButton
          icon={FiCornerDownRight}
          label="Indent"
          action={() => editor.chain().focus().sinkListItem('listItem').run()}
        />
        <ToolbarButton
          icon={FiCornerUpLeft}
          label="Outdent"
          action={() => editor.chain().focus().liftListItem('listItem').run()}
        />
      </div>

      {/* Row 3: Headings, advanced formatting, tables, links */}
      <div className="flex items-center space-x-1 p-2">
        {/* Headings */}
        <div className="relative">
          <DropdownButton
            icon={FiHash}
            label="Heading"
            value={getCurrentHeading()?.label || 'Normal'}
            onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
            isActive={showHeadingDropdown}
          />
          {showHeadingDropdown && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowHeadingDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                Normal
              </button>
              {headings.map((heading) => (
                                 <button
                   key={heading.value}
                   onClick={() => {
                     editor.chain().focus().toggleHeading({ level: heading.value as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                     setShowHeadingDropdown(false);
                   }}
                   className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                 >
                   {heading.label}
                 </button>
              ))}
            </div>
          )}
        </div>

        {/* Line Height */}
        <div className="relative">
          <DropdownButton
            icon={FiType}
            label="Line Height"
            value={getCurrentLineHeight().label}
            onClick={() => setShowLineHeightDropdown(!showLineHeightDropdown)}
            isActive={showLineHeightDropdown}
          />
          {showLineHeightDropdown && (
            <div className="absolute top-full left-0 mt-1 w-20 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {lineHeights.map((height) => (
                <button
                  key={height.value}
                  onClick={() => {
                    editor.chain().focus().setLineHeight(height.value).run();
                    setShowLineHeightDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  {height.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Advanced Formatting */}
        <ToolbarButton
          icon={FiMessageSquare}
          label="Blockquote"
          action={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        />
        <ToolbarButton
          icon={FiCode}
          label="Code Block"
          action={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
        />
        <ToolbarButton
          icon={FiMinus}
          label="Horizontal Rule"
          action={() => editor.chain().focus().setHorizontalRule().run()}
        />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Links and Tables */}
        <ToolbarButton
          icon={FiLink}
          label="Insert Link"
          action={onLinkClick}
          isActive={editor.isActive('link')}
        />
        <ToolbarButton
          icon={FiTable}
          label="Insert Table"
          action={onTableClick}
        />
      </div>
    </div>
  );
}
