import type { NextApiRequest, NextApiResponse } from 'next';
import { VectorStore } from '@/lib/vector-store';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const vectorStore = new VectorStore();
    
    // Get paper count
    const paperCount = await vectorStore.getPaperCount();
    
    // Get all papers
    const allPapers = await vectorStore.getAllPapers();
    
    res.status(200).json({
      success: true,
      data: {
        paperCount,
        papers: allPapers.map(paper => ({
          paperId: paper.paperId,
          title: paper.title,
          hasAbstract: !!paper.abstract,
          hasFullText: !!paper.fullText,
          embeddingLength: paper.embedding.length,
          timestamp: paper.timestamp
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Vector store test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
