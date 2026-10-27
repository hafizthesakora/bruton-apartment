CREATE TABLE "guest_login_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_key" varchar(160) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "change_requests" ADD COLUMN "response" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "change_requests" ADD COLUMN "resolved_by" integer;--> statement-breakpoint
CREATE INDEX "guest_login_codes_contact_idx" ON "guest_login_codes" USING btree ("contact_key","created_at");--> statement-breakpoint
CREATE INDEX "change_requests_status_idx" ON "change_requests" USING btree ("status");