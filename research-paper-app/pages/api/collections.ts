import type { NextApiRequest, NextApiResponse } from 'next';
import type { Collection, Paper } from '@/types/paper';
import { PDFProcessor } from '@/lib/pdf-processor';
import { VectorStore } from '@/lib/vector-store';
import { GeminiAIClient } from '@/lib/gemini-ai';
import { 
  createCollection,
  getCollections as getSupabaseCollections,
  getCollection as getSupabaseCollection,
  updateCollection as updateSupabaseCollection,
  deleteCollection as deleteSupabaseCollection,
  addPaperToCollection as addPaperToSupabaseCollection,
  removePaperFromCollection as removePaperFromSupabaseCollection
} from '@/lib/supabase';

// Helper function to process paper for RAG
async function processPaperForRAG(paper: Paper): Promise<boolean> {
  try {
    console.log(`🔍 Starting RAG processing for paper: ${paper.paperId} - "${paper.title}"`);
    
    // Check if paper is already in vector store
    const vectorStore = new VectorStore();
    const existingPaper = await vectorStore.getPaper(paper.paperId);
    
    if (existingPaper) {
      console.log(`📋 Paper ${paper.paperId} already processed for RAG`);
      return true;
    }

    // Only process if PDF URL is available
    if (!paper.pdfUrl) {
      console.log(`⚠️ No PDF URL available for paper ${paper.paperId}`);
      return false;
    }

    console.log(`📥 Processing PDF for paper ${paper.paperId} from URL: ${paper.pdfUrl}`);

    // Process the PDF
    const pdfData = await PDFProcessor.processPDF(paper.pdfUrl);
    
    if (pdfData.text.includes('PDF processing failed:')) {
      console.error(`❌ PDF processing failed for paper ${paper.paperId}: ${pdfData.text}`);
      return false;
    }
    
    console.log(`📄 PDF processed successfully. Text length: ${pdfData.text.length}, Pages: ${pdfData.pageCount}`);
    
    // Clean and extract sections
    const cleanedText = PDFProcessor.cleanText(pdfData.text);
    const extractedAbstract = PDFProcessor.extractAbstract(cleanedText) || paper.abstract;
    const introduction = PDFProcessor.extractIntroduction(cleanedText);
    const conclusion = PDFProcessor.extractConclusion(cleanedText);

    console.log(`🧹 Text cleaned. Abstract: ${!!extractedAbstract}, Introduction: ${!!introduction}, Conclusion: ${!!conclusion}`);

    // Generate embedding using Gemini AI
    let embedding: number[] = [];
    try {
      console.log(`🤖 Generating embedding for paper ${paper.paperId}...`);
      const geminiClient = new GeminiAIClient();
      const textForEmbedding = `${paper.title} ${extractedAbstract || ''} ${introduction || ''}`;
      embedding = await geminiClient.generateEmbedding(textForEmbedding);
      console.log(`✅ Embedding generated successfully. Length: ${embedding.length}`);
    } catch (error) {
      console.warn(`⚠️ Failed to generate embedding for paper ${paper.paperId}:`, error);
      // Create a simple embedding as fallback
      embedding = new Array(768).fill(0).map(() => Math.random() - 0.5);
      console.log(`🔄 Using fallback embedding. Length: ${embedding.length}`);
    }

    // Add to Vector Store
    console.log(`💾 Adding paper ${paper.paperId} to vector store...`);
    await vectorStore.addPaper({
      paperId: paper.paperId,
      title: paper.title,
      abstract: extractedAbstract || undefined,
      fullText: cleanedText,
      embedding,
      metadata: {
        authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown',
        year: paper.year || new Date().getFullYear(),
        pageCount: pdfData.pageCount,
        pdfUrl: paper.pdfUrl,
        localFilePath: pdfData.localFilePath,
        hasIntroduction: !!introduction,
        hasConclusion: !!conclusion
      }
    });

    console.log(`✅ Successfully added paper ${paper.paperId} to vector store`);

    // Clean up the local file after processing
    if (pdfData.localFilePath) {
      PDFProcessor.cleanupLocalFile(pdfData.localFilePath);
      console.log(`🗑️ Cleaned up local file: ${pdfData.localFilePath}`);
    }

    console.log(`🎉 Successfully processed paper ${paper.paperId} for RAG`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing paper ${paper.paperId} for RAG:`, error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return handleGetCollections(req, res);
    case 'POST':
      return handleCreateCollection(req, res);
    case 'PUT':
      return handleUpdateCollection(req, res);
    case 'DELETE':
      return handleDeleteCollection(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetCollections(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    if (id) {
      const collection = await getSupabaseCollection(id as string);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      return res.status(200).json({ success: true, data: collection });
    }

    const collections = await getSupabaseCollections();
    return res.status(200).json({ success: true, data: collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return res.status(500).json({ error: 'Failed to fetch collections' });
  }
}

async function handleCreateCollection(req: NextApiRequest, res: NextApiResponse) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Collection name is required' });
  }

  try {
    const newCollection = await createCollection({
      name: name.trim(),
      description: description?.trim() || '',
      papers: []
    });

    return res.status(201).json({ success: true, data: newCollection });
  } catch (error) {
    console.error('Error creating collection:', error);
    return res.status(500).json({ error: 'Failed to create collection' });
  }
}

async function handleUpdateCollection(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { name, description, papers, addPaper, removePaper } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Collection ID is required' });
  }

  try {
    // Handle adding a single paper
    if (addPaper) {
      const paperToAdd = addPaper as Paper;
      console.log(`Adding paper ${paperToAdd.paperId} to collection ${id}`);
      
      // Add paper to collection in Supabase
      const success = await addPaperToSupabaseCollection(id as string, paperToAdd);
      if (!success) {
        console.error(`Failed to add paper ${paperToAdd.paperId} to collection ${id} in Supabase`);
        return res.status(500).json({ error: 'Failed to add paper to collection' });
      }
      
      console.log(`Successfully added paper ${paperToAdd.paperId} to collection ${id} in Supabase`);
      
      // Process paper for RAG in the background
      console.log(`Starting RAG processing for paper ${paperToAdd.paperId}...`);
      processPaperForRAG(paperToAdd).then(success => {
        if (success) {
          console.log(`✅ Paper ${paperToAdd.paperId} successfully processed for RAG`);
        } else {
          console.error(`❌ Failed to process paper ${paperToAdd.paperId} for RAG`);
        }
      }).catch(error => {
        console.error(`❌ Error during RAG processing for paper ${paperToAdd.paperId}:`, error);
      });
    }
    // Handle removing a single paper
    else if (removePaper) {
      const paperIdToRemove = removePaper as string;
      console.log(`Removing paper ${paperIdToRemove} from collection ${id}`);
      
      // Remove paper from collection in Supabase
      const success = await removePaperFromSupabaseCollection(id as string, paperIdToRemove);
      if (!success) {
        console.error(`Failed to remove paper ${paperIdToRemove} from collection ${id}`);
        return res.status(500).json({ error: 'Failed to remove paper from collection' });
      }
      
      console.log(`Successfully removed paper ${paperIdToRemove} from collection ${id}`);
    }
    // Handle updating collection metadata
    else if (name || description !== undefined) {
      const updatedCollection = await updateSupabaseCollection(id as string, {
        name,
        description
      });
      
      if (!updatedCollection) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      
      return res.status(200).json({ success: true, data: updatedCollection });
    }
    // Handle replacing all papers (not recommended, but keeping for compatibility)
    else if (papers) {
      // This would require more complex logic to handle paper replacement
      // For now, we'll return an error suggesting to use individual paper operations
      return res.status(400).json({ 
        error: 'Bulk paper replacement not supported. Use individual paper operations instead.' 
      });
    }

    // Return the updated collection
    const updatedCollection = await getSupabaseCollection(id as string);
    if (!updatedCollection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.status(200).json({ success: true, data: updatedCollection });
  } catch (error) {
    console.error('Error updating collection:', error);
    return res.status(500).json({ error: 'Failed to update collection' });
  }
}

async function handleDeleteCollection(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Collection ID is required' });
  }

  try {
    const success = await deleteSupabaseCollection(id as string);
    if (!success) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.status(200).json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return res.status(500).json({ error: 'Failed to delete collection' });
  }
}
