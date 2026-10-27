ALTER TABLE "notifications" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");