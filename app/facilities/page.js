export const dynamic = 'force-dynamic';

import { readJSON } from '@/lib/data';
import FacilitiesClient from './FacilitiesClient';

export default async function FacilitiesPage() {
  const content = await readJSON('content.json') || {};
  const facilitiesData = content.facilities || {};

  return <FacilitiesClient initialData={facilitiesData} />;
}
