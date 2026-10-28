'use client';
import SectionHeading from './ui/SectionHeading';
import ApartmentCard from './ui/ApartmentCard';
import LuxeButton from './ui/LuxeButton';
import { FadeIn } from './MotionWrapper';

// Apartments come from listShowcase (server side, in app/page.js).
export default function HomeApartments({ apartments = [] }) {
  if (!apartments.length) return null;

  return (
    <section className="section-y bg-sand/50">
      <div className="container-luxe">
        <div className="mb-16 flex flex-col justify-between gap-8 md:mb-24 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Apartments"
            title="Rooms made for slow mornings"
            intro="Each apartment is fully furnished, quietly styled and ready for a night, a week or a season."
          />
          <FadeIn direction="up" delay={0.2}>
            <LuxeButton href="/book" variant="garden" arrow>See all availability</LuxeButton>
          </FadeIn>
        </div>

        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apt, i) => (
            <div key={apt.id} className={i % 3 === 1 ? 'lg:mt-24' : ''}>
              <ApartmentCard apartment={apt} index={i % 3} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
