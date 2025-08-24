import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test basic Supabase connection
    const { data, error } = await supabase
      .from('collections')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase connection failed',
        details: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Supabase connection successful',
        collectionsCount: data?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Supabase test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
