import RoomServiceClient from './RoomServiceClient';

export const metadata = {
  title: 'Room Service — Bruton Gardens & Apartments',
  description: 'Order food and drinks to your apartment. Charged to your bill.',
};

export default function RoomServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <p className="text-lime-600 font-medium text-sm uppercase tracking-wide">Staying with us?</p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Room service</h1>
          <p className="text-gray-600 mt-2">Order to your apartment — it’s added to your bill, so you can settle everything at check-out.</p>
        </div>
        <RoomServiceClient />
      </div>
    </div>
  );
}
