ALTER TABLE "notifications" ADD COLUMN "viewing_id" integer;--> statement-breakpoint
ALTER TABLE "viewings" ADD COLUMN "staff_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "viewings" ADD COLUMN "outlook_event_id" text;--> statement-breakpoint
ALTER TABLE "viewings" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "viewings_slot_idx" ON "viewings" USING btree ("scheduled_at") WHERE "viewings"."status" in ('requested', 'confirmed');