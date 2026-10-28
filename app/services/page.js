export const dynamic = 'force-dynamic';

import { readJSON } from '@/lib/data';
import { getDb } from '@/lib/db';
import { listShowcase } from '@/lib/apartments';
import ServicesClient from './ServicesClient';

async function showcase() {
  try {
    return await listShowcase(await getDb());
  } catch (err) {
    console.error('[services] apartments showcase failed', err);
    return [];
  }
}

export default async function ServicesPage() {
  const [content, apartments] = await Promise.all([readJSON('content.json'), showcase()]);
  const servicesData = content?.services || {};

  return <ServicesClient initialData={servicesData} apartments={apartments} />;
}
