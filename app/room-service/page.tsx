import RoomServiceClient from './RoomServiceClient';
import GuestPage from '../_Components/ui/GuestPage';

export const metadata = {
  title: 'Room Service — Bruton Gardens & Apartments',
  description: 'Order food and drinks to your apartment. Charged to your bill.',
};

export default function RoomServicePage() {
  return (
    <GuestPage
      eyebrow="Staying with us?"
      title="Room service"
      image="/assets/bed.JPEG"
      intro="Order to your apartment — it’s added to your bill, so you can settle everything at check-out."
    >
      <RoomServiceClient />
    </GuestPage>
  );
}
