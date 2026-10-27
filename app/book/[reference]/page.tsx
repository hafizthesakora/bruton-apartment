import BookingStatus from './BookingStatus';

export const metadata = { title: 'Your Booking — Bruton Gardens & Apartments' };

export default async function BookingStatusPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-xl">
        <BookingStatus reference={reference.toUpperCase()} />
      </div>
    </div>
  );
}
