import { Suspense } from 'react';
import BookClient from './BookClient';

export const metadata = {
  title: 'Book Your Stay — Bruton Gardens & Apartments',
  description: 'Check availability and book a fully furnished apartment at Bruton Gardens.',
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <p className="text-lime-600 font-medium text-sm uppercase tracking-wide">Book your stay</p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Check availability</h1>
        </div>
        <Suspense>
          <BookClient />
        </Suspense>
      </div>
    </div>
  );
}
