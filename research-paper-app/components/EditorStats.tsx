'use client';

import React from 'react';
import type { DocumentStats } from '@/types/editor';

interface EditorStatsProps {
  stats: DocumentStats;
}

export function EditorStats({ stats }: EditorStatsProps) {
  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600">
      <div className="flex items-center space-x-1">
        <span className="font-medium">{stats.words}</span>
        <span>words</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="font-medium">{stats.characters}</span>
        <span>characters</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="font-medium">{stats.paragraphs}</span>
        <span>paragraphs</span>
      </div>
    </div>
  );
}
