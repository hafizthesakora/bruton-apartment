import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const USE_MONGO = !!process.env.MONGODB_URI;
  const result = {
    USE_MONGO,
    MONGODB_URI_SET: !!process.env.MONGODB_URI,
    MONGODB_URI_PREFIX: process.env.MONGODB_URI?.slice(0, 30) + '...',
    VERCEL: !!process.env.VERCEL,
    mongoStatus: null,
    contentSample: null,
    error: null,
  };

  if (!USE_MONGO) {
    result.mongoStatus = 'SKIPPED — MONGODB_URI not set, using filesystem';
    return NextResponse.json(result);
  }

  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const col = client.db('bruton').collection('site_data');
    const doc = await col.findOne({ _id: 'content.json' });
    await client.close();

    if (doc) {
      result.mongoStatus = 'CONNECTED — document found';
      // Show just top-level keys and home hero title as a sample
      result.contentSample = {
        topLevelKeys: Object.keys(doc.data || {}),
        homeHeroTitle: doc.data?.home?.hero?.title || '(not found)',
        aboutHeroTitle: doc.data?.about?.hero?.title || '(not found)',
      };
    } else {
      result.mongoStatus = 'CONNECTED — no document yet (will be seeded on first read)';
    }
  } catch (err) {
    result.mongoStatus = 'ERROR';
    result.error = err.message;
  }

  return NextResponse.json(result);
}
