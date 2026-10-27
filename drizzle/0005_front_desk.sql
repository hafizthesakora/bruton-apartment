ALTER TABLE "bookings" ADD COLUMN "security_deposit_returned" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "key_returned" boolean DEFAULT false NOT NULL;