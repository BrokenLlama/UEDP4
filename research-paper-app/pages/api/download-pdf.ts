import type { NextApiRequest, NextApiResponse } from 'next';
import { PDFProcessor } from '@/lib/pdf-processor';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfUrl, filename } = req.body;

  if (!pdfUrl) {
    return res.status(400).json({ error: 'PDF URL is required' });
  }

  try {
    // Download and save the PDF locally first
    const localFilePath = await PDFProcessor.downloadAndSavePDF(pdfUrl, filename);
    
    // Read the local file
    const pdfBuffer = fs.readFileSync(localFilePath);
    
    // Set response headers for file download
    const safeFilename = filename || `paper_${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer
    res.send(pdfBuffer);

    // Clean up the local file after sending
    setTimeout(() => {
      PDFProcessor.cleanupLocalFile(localFilePath);
    }, 1000);

  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ 
      error: 'Failed to download PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
