import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAlexClient } from '@/lib/openalex-client';
import type { Citation } from '@/types/paper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paperId } = req.query;

  if (!paperId || typeof paperId !== 'string') {
    return res.status(400).json({ error: 'Paper ID is required' });
  }

  try {
    const client = new OpenAlexClient();
    
    // Get the paper details first
    const work = await client.getWork(paperId);
    
    // Get citations (papers that cite this work)
    const citations = await client.getCitations(paperId);
    
    const citationData: Citation[] = citations.map((citation: any) => ({
      paperId: citation.id.split('/').pop() || citation.id,
      title: citation.display_name,
      authors: citation.authorships?.map((a: any) => ({ 
        authorId: a.author.id.split('/').pop() || a.author.id, 
        name: a.author.display_name 
      })) || [],
      year: citation.publication_year || null,
      venue: citation.primary_location?.source?.display_name || null,
      url: citation.primary_location?.landing_page_url || citation.open_access?.oa_url || null,
      doi: citation.doi || null
    }));

    res.status(200).json({
      success: true,
      data: citationData,
      count: citationData.length
    });

  } catch (error) {
    console.error('Error fetching citations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch citations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
