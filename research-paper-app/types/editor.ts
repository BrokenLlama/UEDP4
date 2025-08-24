export interface EditorState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  fontSize: string;
  fontFamily: string;
  lineHeight: string;
  headingLevel: number | null;
  isBulletList: boolean;
  isOrderedList: boolean;
  isTaskList: boolean;
  isBlockquote: boolean;
  isCodeBlock: boolean;
  isLink: boolean;
  linkUrl: string;
  linkText: string;
}

export interface DocumentStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  sentences: number;
}

export interface FindReplaceState {
  isOpen: boolean;
  findText: string;
  replaceText: string;
  isCaseSensitive: boolean;
  isRegex: boolean;
  currentMatch: number;
  totalMatches: number;
}

export interface ExportOptions {
  format: 'html' | 'text' | 'print';
  includeStyles: boolean;
}

export interface TableInsertOptions {
  rows: number;
  columns: number;
  withHeaderRow: boolean;
}

export interface LinkDialogState {
  isOpen: boolean;
  url: string;
  text: string;
  isNewTab: boolean;
}

export interface FontOption {
  value: string;
  label: string;
  family: string;
}

export interface FontSizeOption {
  value: string;
  label: string;
}

export interface LineHeightOption {
  value: string;
  label: string;
}

export interface HeadingOption {
  value: number;
  label: string;
}

export interface ToolbarButton {
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  shortcut?: string;
}

export interface DocumentEditorProps {
  initialContent?: string;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onSave?: (content: string) => void;
  onContentChange?: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  showStats?: boolean;
  showFindReplace?: boolean;
  showExport?: boolean;
  showFullScreen?: boolean;
}
