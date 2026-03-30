export const dynamic = 'force-dynamic';

import { readJSON } from '@/lib/data';
import BlogClient from './BlogClient';

export default async function BlogPage() {
  const content = await readJSON('content.json') || {};
  const galleryData = content.gallery || {};

  return <BlogClient initialData={galleryData} />;
}
