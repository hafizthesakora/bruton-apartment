import BookingStatus from './BookingStatus';
import GuestPage from '../../_Components/ui/GuestPage';

export const metadata = { title: 'Your Booking — Bruton Gardens & Apartments' };

export default async function BookingStatusPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <GuestPage width="max-w-2xl">
      <BookingStatus reference={reference.toUpperCase()} />
    </GuestPage>
  );
}
