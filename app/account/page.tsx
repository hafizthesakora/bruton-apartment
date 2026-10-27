import AccountClient from './AccountClient';

export const metadata = {
  title: 'My Booking — Bruton Gardens & Apartments',
  description: 'See your bookings, bills and receipts, and ask the front desk for changes.',
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <p className="text-lime-600 font-medium text-sm uppercase tracking-wide">My booking</p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Your stays with us</h1>
        </div>
        <AccountClient />
      </div>
    </div>
  );
}
