import type { NextApiRequest, NextApiResponse } from 'next';
import { GeminiAIClient } from '@/lib/gemini-ai';
import { VectorStore } from '@/lib/vector-store';
import { getCollection } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { collectionId, message, chatHistory = [] } = req.body;

  if (!collectionId || !message) {
    return res.status(400).json({ error: 'Collection ID and message are required' });
  }

  try {
    console.log(`Fetching collection ${collectionId} from Supabase...`);
    
    // Get collection data from Supabase
    const collection = await getCollection(collectionId);
    if (!collection) {
      console.log(`Collection ${collectionId} not found in Supabase`);
      return res.status(404).json({ error: 'Collection not found' });
    }

    console.log(`Found collection: ${collection.name} with ${collection.papers.length} papers`);

    // Get all papers from the collection that are in the vector store
    const vectorStore = new VectorStore();
    const collectionPapers: any[] = [];
    
    console.log('Checking papers in vector store...');
    for (const paper of collection.papers) {
      try {
        const vectorResult = await vectorStore.getPaper(paper.paperId);
        if (vectorResult) {
          collectionPapers.push(vectorResult);
          console.log(`Found paper ${paper.paperId} in vector store`);
        } else {
          console.log(`Paper ${paper.paperId} not found in vector store`);
        }
      } catch (error) {
        console.warn(`Error checking paper ${paper.paperId} in vector store:`, error);
      }
    }

    console.log(`Found ${collectionPapers.length} papers with RAG data`);

    if (collectionPapers.length === 0) {
      return res.status(400).json({ 
        error: 'No papers in this collection have been processed for AI chat. Please add papers with PDFs and wait for processing to complete.',
        details: 'Papers need to be processed for RAG before you can chat with the collection.'
      });
    }

    // Create context from all papers in the collection
    let collectionContext = `Collection: ${collection.name}\n`;
    if (collection.description) {
      collectionContext += `Description: ${collection.description}\n`;
    }
    collectionContext += `Number of papers: ${collectionPapers.length}\n\n`;

    // Add information about each paper
    collectionContext += 'Papers in this collection:\n';
    collectionPapers.forEach((paper, index) => {
      collectionContext += `${index + 1}. ${paper.title}\n`;
      collectionContext += `   Authors: ${paper.metadata.authors || 'Unknown'}\n`;
      collectionContext += `   Year: ${paper.metadata.year || 'Unknown'}\n`;
      if (paper.abstract) {
        collectionContext += `   Abstract: ${paper.abstract.substring(0, 200)}...\n`;
      }
      collectionContext += '\n';
    });

    // Add full text from papers (truncated to avoid token limits)
    collectionContext += 'Full content from papers:\n';
    collectionPapers.forEach((paper, index) => {
      collectionContext += `\n--- Paper ${index + 1}: ${paper.title} ---\n`;
      if (paper.fullText) {
        // Limit each paper's text to avoid token limits
        const maxLength = 3000;
        const truncatedText = paper.fullText.length > maxLength 
          ? paper.fullText.substring(0, maxLength) + '...'
          : paper.fullText;
        collectionContext += truncatedText + '\n';
      }
    });

    // Create the system prompt
    const systemPrompt = `You are an AI assistant that helps users understand and discuss research papers from a collection called "${collection.name}".

${collectionContext}

You have access to the full content of ${collectionPapers.length} research papers in this collection. Please answer questions about:
- Individual papers and their content
- Relationships between papers in the collection
- Themes and patterns across the collection
- Specific findings, methodologies, or conclusions from any paper
- Comparisons between papers

If the user asks about something not covered in these papers, politely indicate that the information is not available in this collection. Always cite which paper(s) you're referring to when answering questions.`;

    console.log('Initializing Gemini AI client...');
    
    // Initialize Gemini AI client
    let response: string;
    try {
      const geminiClient = new GeminiAIClient();
      
      // Create conversation history
      const conversationHistory = chatHistory.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      // Add the current message
      const currentMessage = {
        role: 'user' as const,
        parts: [{ text: message }]
      };

      console.log('Sending request to Gemini AI...');
      response = await geminiClient.chat(systemPrompt, conversationHistory, currentMessage);
      console.log('Received response from Gemini AI');
    } catch (error) {
      console.error('Error with Gemini AI:', error);
      return res.status(500).json({ 
        error: 'Failed to generate response from AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    console.log('Sending successful response');
    res.status(200).json({
      success: true,
      data: {
        response,
        collectionId,
        papersProcessed: collectionPapers.length,
        totalPapers: collection.papers.length
      }
    });

  } catch (error) {
    console.error('Error chatting with collection:', error);
    res.status(500).json({ 
      error: 'Failed to chat with collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
