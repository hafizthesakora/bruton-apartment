/** Shape of GET /api/admin/folios/[id] (lib/booking/folios.ts folioDetail). */
export type FolioDetail = {
  booking: {
    id: number; reference: string; status: string; source: string; channelRef: string | null;
    checkIn: string; checkOut: string; nights: number; adults: number; children: number; apartmentName: string; createdAt: string;
  };
  guest: { id: number; fullName: string; phone: string | null; email: string | null };
  entries: { id: number; type: 'charge' | 'payment' | 'refund'; description: string; amount: number; method: string | null; reference: string | null; createdAt: string; staffName: string | null }[];
  totals: { charges: number; payments: number; refunds: number; paid: number; balance: number };
  site: { name: string; phone: string; url: string };
};
