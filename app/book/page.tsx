import { Suspense } from 'react';
import BookClient from './BookClient';
import GuestPage from '../_Components/ui/GuestPage';

export const metadata = {
  title: 'Book Your Stay — Bruton Gardens & Apartments',
  description: 'Check availability and book a fully furnished apartment at Bruton Gardens.',
};

export default function BookPage() {
  return (
    <GuestPage eyebrow="Book your stay" title="Check availability" image="/assets/BRTN GRDN-10.JPEG" intro="Choose your dates, pick an apartment, and you're done in a couple of minutes.">
      <Suspense>
        <BookClient />
      </Suspense>
    </GuestPage>
  );
}
