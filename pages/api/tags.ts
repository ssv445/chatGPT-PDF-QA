import type { NextApiRequest, NextApiResponse } from 'next';
import tagsAsObject from '@/docs/tags.json';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const tags = Object.keys(tagsAsObject);
    res.status(200).json(tags);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
