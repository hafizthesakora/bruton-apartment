export const dynamic = 'force-dynamic';

import { readJSON } from '@/lib/data';
import ServicesClient from './ServicesClient';

export default async function ServicesPage() {
  const content = await readJSON('content.json') || {};
  const servicesData = content.services || {};

  return <ServicesClient initialData={servicesData} />;
}
