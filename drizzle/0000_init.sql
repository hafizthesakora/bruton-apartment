CREATE TYPE "public"."booking_source" AS ENUM('direct', 'airbnb', 'booking_com', 'vrbo', 'expedia', 'walk_in', 'phone');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('held', 'pending_payment', 'confirmed', 'checked_in', 'checked_out', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_stage" AS ENUM('lead', 'quoted', 'deposit_paid', 'confirmed', 'lost');--> statement-breakpoint
CREATE TYPE "public"."folio_type" AS ENUM('charge', 'payment', 'refund');--> statement-breakpoint
CREATE TYPE "public"."hk_status" AS ENUM('clean', 'dirty', 'in_progress', 'out_of_order');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('received', 'preparing', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('paystack', 'cash', 'transfer', 'momo', 'card', 'ota');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('deposit', 'full', 'pay_on_arrival');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('owner', 'manager', 'front_desk', 'housekeeping');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."viewing_status" AS ENUM('requested', 'confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(32) NOT NULL,
	"message" text NOT NULL,
	"booking_id" integer,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apartment_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"apartment_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apartments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"max_guests" integer DEFAULT 2 NOT NULL,
	"bedrooms" integer DEFAULT 1 NOT NULL,
	"bathrooms" integer DEFAULT 1 NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"lodgify_property_id" text,
	"lodgify_room_type_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apartments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"actor_name" text NOT NULL,
	"entity" varchar(48) NOT NULL,
	"entity_id" text,
	"action" varchar(48) NOT NULL,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(16) NOT NULL,
	"apartment_id" integer NOT NULL,
	"guest_id" integer NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"status" "booking_status" NOT NULL,
	"source" "booking_source" DEFAULT 'direct' NOT NULL,
	"channel_ref" text,
	"payment_mode" "payment_mode" DEFAULT 'full' NOT NULL,
	"total_amount" integer NOT NULL,
	"amount_due_now" integer NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"id_captured" boolean DEFAULT false NOT NULL,
	"key_issued" boolean DEFAULT false NOT NULL,
	"security_deposit" integer DEFAULT 0 NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"reminder_sent_at" timestamp with time zone,
	"review_requested_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"message" text NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "channel_sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"direction" varchar(8) NOT NULL,
	"action" varchar(24) NOT NULL,
	"status" varchar(16) NOT NULL,
	"payload" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"event_date" date NOT NULL,
	"event_type" text NOT NULL,
	"headcount" integer NOT NULL,
	"stage" "event_stage" DEFAULT 'lead' NOT NULL,
	"quote_amount" integer,
	"deposit_amount" integer,
	"deposit_paid_at" timestamp with time zone,
	"catering_notes" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"apartment_id" integer,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"amount" integer NOT NULL,
	"date" date NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folio_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"type" "folio_type" NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"method" "payment_method",
	"reference" text,
	"order_id" integer,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_login_tokens" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"id_type" text,
	"id_number" text,
	"nationality" text,
	"notes" text DEFAULT '' NOT NULL,
	"merged_into_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housekeeping_status" (
	"apartment_id" integer PRIMARY KEY NOT NULL,
	"status" "hk_status" DEFAULT 'clean' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housekeeping_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"apartment_id" integer NOT NULL,
	"assigned_to" integer,
	"date" date NOT NULL,
	"task" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"apartment_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"priority" varchar(8) DEFAULT 'normal' NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"out_of_order" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Mains' NOT NULL,
	"price" integer NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" varchar(8) NOT NULL,
	"to" text NOT NULL,
	"template" varchar(48) NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"provider" varchar(24) NOT NULL,
	"status" varchar(16) NOT NULL,
	"error" text,
	"booking_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occupancy_daily" (
	"day" date NOT NULL,
	"apartment_id" integer NOT NULL,
	"booking_id" integer,
	"source" "booking_source",
	"revenue" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "occupancy_daily_day_apartment_id_pk" PRIMARY KEY("day","apartment_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"menu_item_id" integer,
	"name" text NOT NULL,
	"unit_price" integer NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"apartment_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'received' NOT NULL,
	"total" integer NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"placed_by" varchar(16) DEFAULT 'guest' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"event_lead_id" integer,
	"provider" varchar(24) NOT NULL,
	"reference" varchar(64) NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(16) DEFAULT 'initialized' NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "payment_intents_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"deposit_pct" integer DEFAULT 50 NOT NULL,
	"allow_deposit" boolean DEFAULT true NOT NULL,
	"allow_pay_on_arrival" boolean DEFAULT false NOT NULL,
	"hold_minutes" integer DEFAULT 15 NOT NULL,
	"free_cancellation_days" integer DEFAULT 7 NOT NULL,
	"cancellation_fee_pct" integer DEFAULT 50 NOT NULL,
	"check_in_time" varchar(5) DEFAULT '14:00' NOT NULL,
	"check_out_time" varchar(5) DEFAULT '11:00' NOT NULL,
	"cancellation_text" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"apartment_id" integer NOT NULL,
	"name" text DEFAULT 'Standard' NOT NULL,
	"base_rate" integer NOT NULL,
	"weekend_rate" integer,
	"weekend_days" jsonb DEFAULT '[5,6]'::jsonb NOT NULL,
	"long_stay_min_nights" integer,
	"long_stay_discount_pct" integer,
	"min_nights" integer DEFAULT 1 NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "viewings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"type" varchar(16) DEFAULT 'physical' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "viewing_status" DEFAULT 'requested' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apartment_photos" ADD CONSTRAINT "apartment_photos_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_entries" ADD CONSTRAINT "folio_entries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housekeeping_status" ADD CONSTRAINT "housekeeping_status_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_open_idx" ON "alerts" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_dates_idx" ON "bookings" USING btree ("check_in","check_out");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_channel_ref_idx" ON "bookings" USING btree ("source","channel_ref");--> statement-breakpoint
CREATE INDEX "folio_booking_idx" ON "folio_entries" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "guests_email_idx" ON "guests" USING btree ("email");--> statement-breakpoint
CREATE INDEX "guests_phone_idx" ON "guests" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "hk_tasks_date_idx" ON "housekeeping_tasks" USING btree ("date");--> statement-breakpoint
CREATE INDEX "viewings_when_idx" ON "viewings" USING btree ("scheduled_at");