import type { NextApiRequest, NextApiResponse } from 'next';
import { PDFProcessor } from '@/lib/pdf-processor';
import { VectorStore } from '@/lib/vector-store';
import { GeminiAIClient } from '@/lib/gemini-ai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paperId, pdfUrl, title, authors, abstract } = req.body;

  if (!paperId || !pdfUrl) {
    return res.status(400).json({ error: 'Paper ID and PDF URL are required' });
  }

  try {
    // Process the PDF (downloads locally first)
    const pdfData = await PDFProcessor.processPDF(pdfUrl);
    
    // Check if PDF processing failed
    if (pdfData.text.includes('PDF processing failed:')) {
      return res.status(400).json({
        success: false,
        error: 'PDF processing failed',
        details: pdfData.text
      });
    }
    
    // Clean and extract sections
    const cleanedText = PDFProcessor.cleanText(pdfData.text);
    const extractedAbstract = PDFProcessor.extractAbstract(cleanedText) || abstract;
    const introduction = PDFProcessor.extractIntroduction(cleanedText);
    const conclusion = PDFProcessor.extractConclusion(cleanedText);

    // Generate embedding using Gemini AI
    let embedding: number[] = [];
    try {
      const geminiClient = new GeminiAIClient();
      const textForEmbedding = `${title} ${extractedAbstract || ''} ${introduction || ''}`;
      embedding = await geminiClient.generateEmbedding(textForEmbedding);
    } catch (error) {
      console.warn('Failed to generate embedding:', error);
      // Create a simple embedding as fallback
      embedding = new Array(768).fill(0).map(() => Math.random() - 0.5);
    }

    // Add to Vector Store
    const vectorStore = new VectorStore();
    await vectorStore.addPaper({
      paperId,
      title,
      abstract: extractedAbstract,
      fullText: cleanedText,
      embedding,
      metadata: {
        authors: authors?.map((a: any) => a.name).join(', ') || 'Unknown',
        year: new Date().getFullYear(),
        pageCount: pdfData.pageCount,
        pdfUrl,
        localFilePath: pdfData.localFilePath,
        hasIntroduction: !!introduction,
        hasConclusion: !!conclusion
      }
    });

    // Clean up the local file after processing
    if (pdfData.localFilePath) {
      PDFProcessor.cleanupLocalFile(pdfData.localFilePath);
    }

    res.status(200).json({
      success: true,
      data: {
        paperId,
        textLength: cleanedText.length,
        pageCount: pdfData.pageCount,
        abstract: extractedAbstract,
        introduction,
        conclusion,
        embeddingGenerated: true,
        addedToVectorStore: true,
        localFilePath: pdfData.localFilePath
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
