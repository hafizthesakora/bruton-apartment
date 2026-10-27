-- Double-booking guard: no two active bookings may overlap on the same apartment.
-- Half-open range [check_in, check_out) so a checkout day can be the next check-in day.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "apartment_id" WITH =,
    daterange("check_in", "check_out", '[)') WITH &&
  ) WHERE ("status" IN ('held', 'pending_payment', 'confirmed', 'checked_in'));
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dates_valid" CHECK ("check_out" > "check_in");
