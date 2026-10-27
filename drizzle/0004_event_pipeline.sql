ALTER TABLE "event_leads" ADD COLUMN "reference" varchar(16);--> statement-breakpoint
UPDATE "event_leads" SET "reference" = 'EV' || lpad("id"::text, 6, '0') WHERE "reference" IS NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ALTER COLUMN "reference" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "catering_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "source" varchar(16) DEFAULT 'website' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "quote_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "quoted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "deposit_paid_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "deposit_method" "payment_method";--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "deposit_reference" text;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "lost_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "staff_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_leads" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "event_lead_id" integer;--> statement-breakpoint
CREATE INDEX "event_leads_date_idx" ON "event_leads" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "event_leads_stage_idx" ON "event_leads" USING btree ("stage");--> statement-breakpoint
ALTER TABLE "event_leads" ADD CONSTRAINT "event_leads_reference_unique" UNIQUE("reference");