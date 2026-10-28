import AccountClient from './AccountClient';
import GuestPage from '../_Components/ui/GuestPage';

export const metadata = {
  title: 'My Booking — Bruton Gardens & Apartments',
  description: 'See your bookings, bills and receipts, and ask the front desk for changes.',
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <GuestPage eyebrow="My booking" title="Your stays with us" width="max-w-4xl">
      <AccountClient />
    </GuestPage>
  );
}
