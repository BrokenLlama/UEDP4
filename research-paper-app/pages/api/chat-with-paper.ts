import type { NextApiRequest, NextApiResponse } from 'next';
import { GeminiAIClient } from '@/lib/gemini-ai';
import { VectorStore } from '@/lib/vector-store';
import type { Paper } from '@/types/paper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paperId, message, chatHistory = [] } = req.body;

  if (!paperId || !message) {
    return res.status(400).json({ error: 'Paper ID and message are required' });
  }

  try {
    // Get paper data from Vector Store
    const vectorStore = new VectorStore();
    let paperContext: string;

    try {
      const vectorResult = await vectorStore.getPaper(paperId);
      if (vectorResult) {
        paperContext = `
Paper Title: ${vectorResult.title}
Authors: ${vectorResult.metadata.authors || 'Unknown'}
Year: ${vectorResult.metadata.year || 'Unknown'}
Abstract: ${vectorResult.abstract || 'No abstract available'}
${vectorResult.fullText ? `Full Text: ${vectorResult.fullText.substring(0, 2000)}...` : ''}

You are an AI assistant that helps users understand and discuss this research paper. 
Please answer questions about the paper's content, methodology, findings, and implications.
If the user asks about something not covered in the paper, politely indicate that the information is not available in this paper.
`;
      } else {
        throw new Error('Paper not found in vector store');
      }
    } catch (error) {
      // If paper not in vector store, return error
      return res.status(404).json({ 
        error: 'Paper not found in vector store. Please process the PDF first.',
        details: 'The paper needs to be added to the vector store before chatting with it.'
      });
    }

    // Initialize Gemini AI client
    let response: string;
    try {
      const geminiClient = new GeminiAIClient();
      response = await geminiClient.chatWithPaper(message, paperContext, chatHistory);
    } catch (error) {
      if (error instanceof Error && error.message.includes('GOOGLE_AI_API_KEY')) {
        return res.status(400).json({
          error: 'Google AI API key not configured',
          details: 'Please set the GOOGLE_AI_API_KEY environment variable to use chat functionality.'
        });
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        response,
        paperId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in chat with paper:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
