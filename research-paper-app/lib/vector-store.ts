import fs from 'fs';
import path from 'path';
import type { Paper } from '@/types/paper';

interface VectorStoreEntry {
  paperId: string;
  title: string;
  abstract?: string;
  fullText?: string;
  embedding: number[];
  metadata: Record<string, any>;
  timestamp: string;
}

export class VectorStore {
  private dataPath: string;
  private data: Map<string, VectorStoreEntry> = new Map();

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'vector-store.json');
    this.loadData();
  }

  private loadData() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load existing data
      if (fs.existsSync(this.dataPath)) {
        const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
        const entries = JSON.parse(fileContent);
        this.data = new Map(Object.entries(entries));
      }
    } catch (error) {
      console.error('Error loading vector store data:', error);
      this.data = new Map();
    }
  }

  private saveData() {
    try {
      console.log(`💾 Saving vector store data to ${this.dataPath}...`);
      const entries = Object.fromEntries(this.data);
      fs.writeFileSync(this.dataPath, JSON.stringify(entries, null, 2));
      console.log(`✅ Vector store data saved successfully. Total papers: ${this.data.size}`);
    } catch (error) {
      console.error('❌ Error saving vector store data:', error);
    }
  }

  async addPaper(paper: {
    paperId: string;
    title: string;
    abstract?: string;
    fullText?: string;
    embedding: number[];
    metadata: Record<string, any>;
  }) {
    console.log(`📝 Adding paper ${paper.paperId} to vector store...`);
    
    const entry: VectorStoreEntry = {
      ...paper,
      timestamp: new Date().toISOString()
    };

    this.data.set(paper.paperId, entry);
    console.log(`💾 Paper ${paper.paperId} added to memory, saving to disk...`);
    
    this.saveData();
    console.log(`✅ Paper ${paper.paperId} successfully saved to vector store`);
  }

  async getPaper(paperId: string): Promise<VectorStoreEntry | null> {
    const paper = this.data.get(paperId) || null;
    if (paper) {
      console.log(`📖 Found paper ${paperId} in vector store`);
    } else {
      console.log(`❌ Paper ${paperId} not found in vector store`);
    }
    return paper;
  }

  async searchPapers(query: string, nResults: number = 10): Promise<VectorStoreEntry[]> {
    // Simple text-based search for now
    const results: Array<{ entry: VectorStoreEntry; score: number }> = [];
    
    for (const entry of this.data.values()) {
      const text = `${entry.title} ${entry.abstract || ''} ${entry.fullText || ''}`.toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (text.includes(queryLower)) {
        // Simple scoring based on how many query words match
        const queryWords = queryLower.split(' ');
        const score = queryWords.filter(word => text.includes(word)).length;
        results.push({ entry, score });
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, nResults)
      .map(result => result.entry);
  }

  async deletePaper(paperId: string) {
    this.data.delete(paperId);
    this.saveData();
  }

  async getAllPapers(): Promise<VectorStoreEntry[]> {
    return Array.from(this.data.values());
  }

  async getPaperCount(): Promise<number> {
    return this.data.size;
  }
}
